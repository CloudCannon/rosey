mod utils;

use self::utils::{RoseySerializer, TranslationRewriter};

use super::{redirect_page, RoseyBuilder};

use std::{
    collections::BTreeMap,
    fmt::Write as FmtWrite,
    fs::File,
    fs::{create_dir_all, read_to_string},
    io::{BufWriter, Write},
    path::{Path, PathBuf, MAIN_SEPARATOR},
    str::FromStr,
};

use base64::{encode_config, CharacterSet, Config};
use charabia::Segment;
use html5ever::{
    buffer_queue::BufferQueue,
    local_name, namespace_url, ns,
    serialize::Serialize,
    tendril::StrTendril,
    tokenizer::{Tokenizer, TokenizerOpts},
    QualName,
};
use kuchiki::{traits::TendrilSink, Attribute, ExpandedName, NodeRef};
use path_slash::PathExt as _;
use sha2::{Digest, Sha256};
use url::Url;
use utils::filepath_to_output_url;

use crate::RoseyTranslation;

const UNSUPPORTED_WRAP_ELEMENTS: [&str; 3] = ["title", "script", "style"];

impl RoseyBuilder {
    pub fn process_html_file(&self, file: &Path) {
        let config = &self.options.config;
        let source_folder = &config.source;
        let relative_path = file.strip_prefix(source_folder).unwrap();
        let dest_folder = &config.dest;
        let images_source = config.images_source.as_ref().unwrap_or(&config.source);

        let content = read_to_string(file).unwrap();

        let mut page = RoseyPage::new(
            content,
            &config.separator,
            &config.tag,
            images_source.to_owned(),
            &config.default_language,
            &self.translations,
            &config.wrap,
            &config.wrap_class,
        );
        page.prepare();

        //If the file is already in a locale folder, then output it only for that locale
        if let Some(key) = self.find_locale_overwrite(file) {
            let url_translations = self.url_translations.get(key);

            page.set_locale_key(key);
            page.rewrite_html();
            page.rewrite_meta_tags(relative_path, &self.url_translations);
            page.rewrite_image_tags();
            page.rewrite_assets();
            page.rewrite_anchors(url_translations);

            let output_path = dest_folder.join(relative_path);
            page.output_file(&output_path);
            return;
        }

        page.rewrite_meta_tags(relative_path, &self.url_translations);

        let default_url_translations = self.url_translations.get(&config.default_language);
        page.rewrite_anchors(default_url_translations);

        let translated_default_url = default_url_translations
            .map(|t| t.get(&relative_path.to_slash_lossy()))
            .flatten()
            .map(Into::into)
            .unwrap_or_else(|| relative_path.to_owned());

        let output_path = dest_folder
            .join(&config.default_language)
            .join(translated_default_url);
        page.output_file(&output_path);

        self.output_redirect_file(
            &config.default_language,
            relative_path,
            &self.url_translations,
        );

        self.translations.keys().for_each(|key| {
            let url_translations = self.url_translations.get(key);

            let translated_url = url_translations
                .map(|t| t.get(&relative_path.to_slash_lossy()))
                .flatten()
                .map(Into::into)
                .unwrap_or_else(|| relative_path.to_owned());

            page.set_locale_key(key);
            page.rewrite_html();
            page.rewrite_meta_tags(relative_path, &self.url_translations);
            page.rewrite_image_tags();
            page.rewrite_assets();
            page.rewrite_anchors(url_translations);

            let output_path = dest_folder.join(key).join(translated_url);
            page.output_file(&output_path);
        });
    }

    pub fn output_redirect_file(
        &self,
        locale: &str,
        relative_path: &Path,
        url_translations: &BTreeMap<String, RoseyTranslation>,
    ) {
        let config = &self.options.config;
        let dest_folder = &config.dest;
        let dest_file = dest_folder.join(relative_path);
        let path = filepath_to_output_url(&relative_path.to_slash_lossy());

        if let Some(parent) = dest_file.parent() {
            create_dir_all(parent).unwrap();
        }

        let output = if let Some(redirect_page) = &config.redirect_page {
            read_to_string(redirect_page).expect("Failed to load custom redirect page.")
        } else {
            redirect_page::DEFAULT.to_string()
        };

        let mut alternates = String::default();
        for key in self
            .translations
            .keys()
            .chain(std::iter::once(&config.default_language))
            .filter(|key| *key != locale)
        {
            let translated_path = url_translations
                .get(key)
                .map(|t| t.get(&relative_path.to_slash_lossy()))
                .flatten()
                .map(|p| filepath_to_output_url(p))
                .unwrap_or_else(|| path.clone());

            write!(
                alternates,
                r#"<link rel="alternate" href="/{key}/{translated_path}" hreflang="{key}">"#
            )
            .expect("Failed to output redirect - alternate link");
        }

        let mut lookup: BTreeMap<String, &str> = BTreeMap::default();
        for key in self
            .translations
            .keys()
            .chain(std::iter::once(&config.default_language))
        {
            let mut split = key.split('-');
            let language = split.next().unwrap();

            lookup.insert(key.to_string(), key);
            lookup.insert(language.to_string(), key);
            if let Some(country) = split.next() {
                lookup.insert(format!("{language}-{country}"), key);
                lookup.insert(format!("{language}_{country}"), key);
            }
        }

        let translated_default_url = if let Some(translated_url) = url_translations
            .get(locale)
            .map(|t| t.get(&relative_path.to_slash_lossy()))
            .flatten()
        {
            filepath_to_output_url(translated_url)
        } else {
            path
        };

        let mut output = output
            .replace("DEFAULT_LANGUAGE", locale)
            .replace("SITE_PATH", &format!("/{translated_default_url}"))
            .replace("ALTERNATES", &alternates);

        if let Ok(lookup) = serde_json::to_string(&lookup) {
            output = output.replace("LOCALE_LOOKUP", &lookup)
        }

        if let Ok(file) = File::create(&dest_file) {
            let mut writer = BufWriter::new(file);
            if writer.write(output.as_bytes()).is_err() {
                eprintln!("Failed to write: {dest_file:?}")
            }
        } else {
            eprintln!("Failed to open: {dest_file:?}")
        }
    }
}

enum RoseyEdit {
    Content(String, String, NodeRef),
    Attribute(String, String, Option<String>, NodeRef),
}

struct RoseyPage<'a> {
    dom: NodeRef,
    edits: Vec<RoseyEdit>,
    html_tag: Option<NodeRef>,
    meta_tag: Option<NodeRef>,
    link_tags: Vec<NodeRef>,
    image_tags: Vec<(Option<String>, Option<String>, NodeRef)>,
    anchor_tags: Vec<(String, NodeRef)>,
    assets: Vec<(String, String, NodeRef)>,
    locale_key: Option<&'a str>,
    should_wrap: bool,
    wrap: &'a Option<Vec<String>>,
    wrap_class: &'a Option<String>,
    pub tag: String,
    pub separator: String,
    pub images_source: PathBuf,
    pub default_language: String,
    pub translations: &'a BTreeMap<String, RoseyTranslation>,
}

impl<'a> RoseyPage<'a> {
    pub fn new(
        content: String,
        separator: &str,
        tag: &str,
        images_source: PathBuf,
        default_language: &str,
        translations: &'a BTreeMap<String, RoseyTranslation>,
        wrap: &'a Option<Vec<String>>,
        wrap_class: &'a Option<String>,
    ) -> Self {
        let dom = kuchiki::parse_html().one(content);
        crate::inline_templates(&dom);

        RoseyPage {
            dom,
            edits: Vec::new(),
            link_tags: Vec::new(),
            image_tags: Vec::new(),
            anchor_tags: Vec::new(),
            assets: Vec::new(),
            separator: separator.to_string(),
            tag: tag.to_string(),
            html_tag: None,
            meta_tag: None,
            images_source,
            default_language: default_language.to_string(),
            translations,
            locale_key: None,
            should_wrap: false,
            wrap,
            wrap_class,
        }
    }

    pub fn set_locale_key(&mut self, locale_key: &'a str) {
        self.locale_key = Some(locale_key);
        self.should_wrap = self
            .wrap
            .as_ref()
            .map_or(false, |langs| langs.contains(&locale_key.to_string()));
    }

    fn get_locale_key(&self) -> &str {
        self.locale_key.unwrap_or(&self.default_language)
    }

    pub fn prepare(&mut self) {
        let dom = self.dom.clone();
        self.process_node(&dom, None, None);
        self.process_image_tags();
        self.process_assets();
        self.process_anchors();

        self.prepare_head();
    }

    pub fn process_anchors(&mut self) {
        let base_url = Url::parse("https://example.com").unwrap();

        for element in self.dom.select("a[href]").unwrap() {
            let attributes = element.attributes.borrow();
            let src = attributes.get("href").unwrap();
            let Ok(parsed) = base_url.join(src) else {
                continue;
            };
            let ext = parsed
                .path()
                .rfind('.')
                .map(|index| parsed.path().split_at(index + 1).1);

            if src.starts_with('/')
                && parsed.host_str() == base_url.host_str()
                && matches!(ext, Some("html") | Some("htm") | None)
                && !self
                    .translations
                    .keys()
                    .chain(std::iter::once(&self.default_language))
                    .any(|key| src.starts_with(&format!("/{key}")))
            {
                self.anchor_tags
                    .push((src.to_string(), element.as_node().clone()));
            }
        }
    }

    pub fn rewrite_anchors(&mut self, url_translations: Option<&RoseyTranslation>) {
        let locale_key = self.get_locale_key();
        let base_url = Url::parse("https://example.com").unwrap();
        for (original, node) in &self.anchor_tags {
            let element = node.as_element().unwrap();
            let mut attributes = element.attributes.borrow_mut();

            let Ok(mut parsed) = base_url.join(original) else {
                continue;
            };

            if parsed.host_str() != base_url.host_str() {
                continue;
            }

            if let Some(urlmap) = url_translations {
                let rel_url = parsed.path().trim_start_matches("/");

                let candidate_url = if rel_url.ends_with("/") {
                    format!("{rel_url}index.html")
                } else if rel_url.ends_with(".html") || rel_url.ends_with(".htm") {
                    rel_url.to_string()
                } else {
                    format!("{rel_url}/index.html")
                };

                if let Some(modified_url) = urlmap.get(&candidate_url) {
                    parsed.set_path(&filepath_to_output_url(&modified_url));
                }
            }

            let output = parsed.as_str().trim_start_matches(base_url.as_str());

            attributes.remove("href");
            attributes.insert("href", format!("/{locale_key}/{output}"));
        }
    }

    pub fn rewrite_html(&mut self) {
        let locale_key = self.get_locale_key();
        let translation = if let Some(translation) = self.translations.get(locale_key) {
            translation
        } else {
            eprintln!(
                "Error: failed to load locale with key {locale_key}. Skipping rewriting HTML."
            );
            return;
        };
        for edit in self.edits.iter() {
            match edit {
                RoseyEdit::Content(key, original, node) => {
                    node.children().for_each(|child| {
                        child.detach();
                    });

                    let element_data = node.as_element().unwrap();
                    let should_prevent_wrap =
                        UNSUPPORTED_WRAP_ELEMENTS.contains(&&element_data.name.local[..]);

                    if let Some(content) = translation.get(key) {
                        let content = if content.contains('<') {
                            let mut rewriter = TranslationRewriter::new(
                                &self.images_source,
                                locale_key,
                                &self.default_language,
                                self.translations,
                                &self.tag,
                                self.should_wrap,
                                self.wrap_class,
                            );
                            let mut tokenizer =
                                Tokenizer::new(&mut rewriter, TokenizerOpts::default());
                            let mut buffer = BufferQueue::new();
                            buffer.push_back(StrTendril::from_str(content).unwrap());
                            let _ = tokenizer.feed(&mut buffer);
                            tokenizer.end();
                            rewriter.finish()
                        } else if self.should_wrap && !should_prevent_wrap {
                            content
                                .as_str()
                                .segment_str()
                                .map(|segment| {
                                    if segment.trim().is_empty() {
                                        segment.to_string()
                                    } else if let Some(class) = self.wrap_class {
                                        format!("<span class=\"{class}\">{segment}</span>")
                                    } else {
                                        format!(
                                            "<span style=\"white-space: nowrap;\">{segment}</span>"
                                        )
                                    }
                                })
                                .collect()
                        } else {
                            content.clone()
                        };
                        node.append(NodeRef::new_text(content));
                    } else {
                        node.append(NodeRef::new_text(original));
                    }
                }
                RoseyEdit::Attribute(key, attr, original, node) => {
                    let mut attributes = node.as_element().unwrap().attributes.borrow_mut();

                    if let Some(value) = translation.get(key) {
                        attributes.remove(attr.as_str());
                        attributes.insert(attr.as_str(), value.clone());
                    } else {
                        attributes.remove(attr.as_str());
                        if let Some(original) = original {
                            attributes.insert(attr.as_str(), original.clone());
                        }
                    }
                }
            }
        }
    }

    pub fn rewrite_assets(&mut self) {
        let locale_key = self.get_locale_key();
        for (attr, original, node) in self.assets.iter() {
            let mut attributes = node.as_element().unwrap().attributes.borrow_mut();
            if let Some(translated_asset) =
                get_translated_asset(original, &self.images_source, locale_key)
            {
                attributes.insert(attr.as_str(), format!("/{translated_asset}"));
            } else {
                attributes.insert(attr.as_str(), original.clone());
            }
        }
    }

    pub fn rewrite_image_tags(&mut self) {
        let locale_key = self.get_locale_key();
        for (original_src, original_srcset, img) in self.image_tags.iter() {
            let mut attributes = img.as_element().unwrap().attributes.borrow_mut();
            if let Some(original) = original_src {
                if let Some(translated_asset) =
                    get_translated_asset(original, &self.images_source, locale_key)
                {
                    attributes.insert("src", format!("/{translated_asset}"));
                } else {
                    attributes.insert("src", original.clone());
                }
            }

            if let Some(original) = original_srcset {
                let srcset = original
                    .split(',')
                    .map(|part| {
                        let mut split = part.split(' ');
                        (split.next(), split.next(), part)
                    })
                    .map(|(src, width, original)| {
                        if let (Some(src), Some(width)) = (src, width) {
                            if let Some(translated_src) =
                                get_translated_asset(src, &self.images_source, locale_key)
                            {
                                return format!("/{} {}", translated_src, width);
                            }
                        }
                        original.to_string()
                    })
                    .fold(String::default(), |mut acc, part| {
                        if !acc.is_empty() {
                            acc.push(',');
                        }
                        acc.push_str(&part);
                        acc
                    });
                attributes.insert("srcset", srcset);
            }
        }
    }

    fn prepare_head(&mut self) {
        let html = if let Ok(html) = self.dom.select_first("html") {
            html
        } else {
            let html = NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("html")),
                BTreeMap::default(),
            );
            self.dom.prepend(html);
            self.dom.select_first("html").unwrap()
        };
        self.html_tag = Some(html.as_node().clone());

        let head = if let Ok(head) = self.dom.select_first("head") {
            head
        } else {
            let head = NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("head")),
                BTreeMap::default(),
            );
            self.dom.prepend(head);
            self.dom.select_first("head").unwrap()
        };
        let head = head.as_node();

        let mut attributes = BTreeMap::new();
        attributes.insert(
            ExpandedName::new("", "http-equiv"),
            Attribute {
                prefix: None,
                value: String::from("content-language"),
            },
        );

        let meta_node = NodeRef::new_element(
            QualName::new(None, ns!(html), local_name!("meta")),
            attributes,
        );
        self.meta_tag = Some(meta_node.clone());

        let indentation = if let Some(first_child) = head.children().next() {
            if let Some(text) = first_child.as_text() {
                first_child.insert_after(meta_node.clone());
                text.borrow().clone()
            } else {
                head.append(meta_node.clone());
                String::from("")
            }
        } else {
            head.append(meta_node.clone());
            String::from("")
        };
        meta_node.insert_after(NodeRef::new_text(&indentation));

        for _i in 0..self.translations.len() {
            let mut attributes = BTreeMap::new();
            attributes.insert(
                ExpandedName::new("", "rel"),
                Attribute {
                    prefix: None,
                    value: String::from("alternate"),
                },
            );
            let node = NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("link")),
                attributes,
            );
            self.link_tags.push(node.clone());
            meta_node.insert_after(node.clone());
            meta_node.insert_after(NodeRef::new_text(&indentation));
        }
    }

    pub fn rewrite_meta_tags(
        &mut self,
        original_relative_path: &Path,
        url_translations: &BTreeMap<String, RoseyTranslation>,
    ) {
        let locale_key = self.get_locale_key();

        let html_tag = self.html_tag.as_ref().unwrap();
        let mut attributes = html_tag.as_element().unwrap().attributes.borrow_mut();
        attributes.remove("lang");
        attributes.insert("lang", locale_key.to_string());

        let meta_tag = self.meta_tag.as_ref().unwrap();
        let mut attributes = meta_tag.as_element().unwrap().attributes.borrow_mut();

        attributes.remove("content");
        attributes.insert("content", locale_key.to_string());

        for (i, key) in self
            .translations
            .iter()
            .map(|(key, _)| key.as_str())
            .chain(std::iter::once(&self.default_language[..]))
            .filter(|key| *key != locale_key)
            .enumerate()
        {
            let translated_path = url_translations
                .get(key)
                .map(|t| t.get(&original_relative_path.to_slash_lossy()))
                .flatten()
                .map(|p| filepath_to_output_url(p))
                .unwrap_or_else(|| {
                    filepath_to_output_url(&original_relative_path.to_slash_lossy())
                });

            let mut attributes = self.link_tags[i]
                .as_element()
                .unwrap()
                .attributes
                .borrow_mut();

            if let Some(hreflang) = attributes.get_mut("hreflang") {
                *hreflang = String::from(key);
            } else {
                attributes.insert("hreflang", String::from(key));
            }

            if let Some(href) = attributes.get_mut("href") {
                *href = format!("/{key}/{translated_path}");
            } else {
                attributes.insert("href", format!("/{key}/{translated_path}"));
            }
        }
    }

    fn process_image_tags(&mut self) {
        for img in self.dom.select("img[src], img[srcset]").unwrap() {
            let attributes = img.attributes.borrow();
            let src = attributes.get("src");
            let srcset = attributes.get("srcset");

            self.image_tags.push((
                src.map(String::from),
                srcset.map(String::from),
                img.as_node().clone(),
            ));
        }
    }

    fn process_assets(&mut self) {
        for element in self
            .dom
            .select("source[src], video[src], audio[src]")
            .unwrap()
        {
            let attributes = element.attributes.borrow();
            let src = attributes.get("src").unwrap();

            self.assets.push((
                "src".to_string(),
                src.to_string(),
                element.as_node().clone(),
            ));
        }

        for element in self.dom.select("a[download][href]").unwrap() {
            let attributes = element.attributes.borrow();
            let href = attributes.get("href").unwrap();

            self.assets.push((
                "href".to_string(),
                href.to_string(),
                element.as_node().clone(),
            ));
        }

        for element in self
            .dom
            .select(&format!("[{}-asset-attrs]", self.tag))
            .unwrap()
        {
            let attributes = element.attributes.borrow();
            let attr = attributes.get(format!("{}-asset-attrs", self.tag));
            if let Some(attr) = attr {
                let original = attributes.get(attr).unwrap_or_default();

                self.assets.push((
                    attr.to_string(),
                    original.to_string(),
                    element.as_node().clone(),
                ));
            }
        }
    }

    fn process_node(&mut self, node: &NodeRef, root: Option<String>, namespace: Option<String>) {
        let mut root = root;
        let mut namespace = namespace;

        if let Some(element) = node.as_element() {
            let mut prefix = String::default();
            let attributes = element.attributes.borrow();

            if let Some(new_root) = attributes.get(format!("{}-root", &self.tag)) {
                root = Some(String::from(new_root));
                namespace = None;
            }

            if let Some(root) = &root {
                if !root.is_empty() {
                    write!(prefix, "{}{}", root, &self.separator)
                        .expect("Failed to write root to prefix");
                }
            }

            namespace = match (namespace, attributes.get(format!("{}-ns", &self.tag))) {
                (Some(namespace), Some(new_namespace)) => {
                    Some(format!("{}{}{}", namespace, &self.separator, new_namespace))
                }
                (Some(namespace), None) => Some(namespace),
                (None, Some(new_namespace)) => Some(String::from(new_namespace)),
                _ => None,
            };

            if let Some(namespace) = &namespace {
                write!(prefix, "{}{}", &namespace, &self.separator)
                    .expect("Failed to write namespace to prefix");
            }

            if let Some(key) = attributes.get(&self.tag[..]) {
                let key = if key.is_empty() {
                    let mut hasher = Sha256::new();
                    hasher.update(node.to_string());
                    let hash = encode_config(
                        hasher.finalize(),
                        Config::new(CharacterSet::Standard, false),
                    );
                    format!("{}{}", &prefix, hash)
                } else {
                    format!("{}{}", &prefix, key)
                };

                let attrs = attributes.get(format!("{}-attrs", self.tag));
                if let Some(attrs) = attrs {
                    for attr in attrs.split(',') {
                        self.edits.push(RoseyEdit::Attribute(
                            format!("{}.{}", key, attr),
                            attr.to_string(),
                            attributes.get(attr).map(String::from),
                            node.clone(),
                        ));
                    }
                }

                let inner_html: String = node.children().map(|child| child.to_string()).collect();
                self.edits
                    .push(RoseyEdit::Content(key, inner_html, node.clone()));
            }

            if let Some(attrs_map) = attributes.get(format!("{}-attrs-explicit", self.tag)) {
                let attrs_map: BTreeMap<String, String> = serde_json::from_str(attrs_map).unwrap();
                for (attr, key) in attrs_map.iter() {
                    self.edits.push(RoseyEdit::Attribute(
                        format!("{}{}", prefix, key),
                        attr.to_string(),
                        attributes.get(attr.as_str()).map(String::from),
                        node.clone(),
                    ));
                }
            }
        }

        for child in node.children() {
            self.process_node(&child, root.clone(), namespace.clone());
        }
    }

    pub fn output_file(&self, output_path: &Path) {
        if let Some(parent) = output_path.parent() {
            create_dir_all(parent).unwrap();
        }

        if let Ok(file) = File::create(output_path) {
            let writer = BufWriter::new(file);
            let mut serializer = RoseySerializer::new(writer);
            if Serialize::serialize(
                &self.dom,
                &mut serializer,
                html5ever::serialize::TraversalScope::IncludeNode,
            )
            .is_err()
            {
                eprintln!("Failed to write: {output_path:?}")
            }
        }
    }
}

pub fn get_translated_asset(original: &str, source: &Path, locale_key: &str) -> Option<String> {
    let original_path = Path::new(original);
    if let Some(ext) = original_path.extension() {
        let mut translated_asset = PathBuf::from(original_path);
        translated_asset.set_extension(format!("{locale_key}.{}", ext.to_str().unwrap()));
        if let Ok(stripped_path) = translated_asset.strip_prefix(MAIN_SEPARATOR.to_string()) {
            translated_asset = stripped_path.to_path_buf();
        }

        let translated_path = source.join(&translated_asset);

        if translated_path.exists() {
            let src = translated_asset.to_str().unwrap().replace('\\', "/");
            return Some(src);
        }
    }
    None
}
