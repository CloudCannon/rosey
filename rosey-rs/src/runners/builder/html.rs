use super::redirect_page;
use super::RoseyBuilder;

use std::fs::File;
use std::fs::OpenOptions;
use std::io::BufWriter;
use std::io::Write;
use std::path::MAIN_SEPARATOR;
use std::{
    collections::{BTreeMap, HashMap},
    fs::{create_dir_all, read_to_string},
    path::{Path, PathBuf},
};

use base64::{encode_config, CharacterSet, Config};
use html5ever::serialize::HtmlSerializer;
use html5ever::serialize::Serialize;
use html5ever::serialize::SerializeOpts;
use html5ever::serialize::Serializer;
use html5ever::{local_name, namespace_url, ns, QualName};
use kuchiki::{traits::TendrilSink, Attribute, ExpandedName, NodeRef};
use sha2::{Digest, Sha256};

use crate::RoseyLocale;

impl RoseyBuilder {
    pub fn process_html_file(&self, file: &Path) {
        let source_folder = self.working_directory.join(&self.source);
        let relative_path = file.strip_prefix(&source_folder).unwrap();
        let dest_folder = self.working_directory.join(&self.dest);
        let images_source = self
            .working_directory
            .join(self.images_source.as_ref().unwrap_or(&self.source));

        let content = read_to_string(file).unwrap();

        let mut page = RoseyPage::new(content, &self.separator, &self.tag);
        page.prepare();
        page.prepare_head(self.locales.len());

        page.rewrite_meta_tags(
            &self.default_language,
            relative_path,
            &self.locales,
            &self.default_language,
        );

        //If the file is already in a locale folder, then output it only for that locale
        if let Some((key, locale)) = self
            .locales
            .iter()
            .find(|(key, _)| relative_path.starts_with(key))
        {
            page.rewrite_html(locale);
            page.rewrite_meta_tags(key, relative_path, &self.locales, &self.default_language);
            page.rewrite_image_tags(&images_source, key);
            page.rewrite_assets(&images_source, key);

            let output_path = dest_folder.join(&relative_path);
            page.output_file(&output_path, true);
            return;
        }

        let output_path = dest_folder
            .join(&self.default_language)
            .join(&relative_path);
        page.output_file(&output_path, false);
        self.output_redirect_file(&self.default_language, relative_path);

        self.locales.iter().for_each(|(key, locale)| {
            page.rewrite_html(locale);
            page.rewrite_meta_tags(key, relative_path, &self.locales, &self.default_language);
            page.rewrite_image_tags(&images_source, key);
            page.rewrite_assets(&images_source, key);

            let output_path = dest_folder.join(key).join(&relative_path);
            page.output_file(&output_path, false);
        });
    }

    pub fn output_redirect_file(&self, locale: &str, relative_path: &Path) {
        let dest_folder = self.working_directory.join(&self.dest);
        let dest_file = dest_folder.join(relative_path);
        let path = relative_path.display().to_string();
        let path = path.trim_end_matches("index.html").replace('\\', "/");

        if let Some(parent) = dest_file.parent() {
            create_dir_all(parent).unwrap();
        }

        let output = if let Some(redirect_page) = &self.redirect_page {
            read_to_string(self.working_directory.join(redirect_page))
                .expect("Failed to load custom redirect page.")
        } else {
            redirect_page::DEFAULT.to_string()
        };

        let mut alternates = String::default();
        for key in (&self.locales)
            .iter()
            .map(|(key, _)| key)
            .chain(std::iter::once(&self.default_language))
            .filter(|key| *key != locale)
        {
            alternates.push_str(&format!(
                r#"<link rel="alternate" href="/{key}/{path}" hreflang="{key}">"#
            ))
        }

        let mut lookup: BTreeMap<String, &str> = BTreeMap::default();
        for key in (&self.locales)
            .iter()
            .map(|(key, _)| key)
            .chain(std::iter::once(&self.default_language))
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

        let mut output = output
            .replace("DEFAULT_LANGUAGE", locale)
            .replace("SITE_PATH", &format!("/{path}"))
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

struct RoseyPage {
    dom: NodeRef,
    edits: Vec<RoseyEdit>,
    meta_tag: Option<NodeRef>,
    link_tags: Vec<NodeRef>,
    image_tags: Vec<(Option<String>, Option<String>, NodeRef)>,
    assets: Vec<(String, String, NodeRef)>,
    pub tag: String,
    pub separator: String,
}

impl RoseyPage {
    pub fn new(content: String, separator: &str, tag: &str) -> Self {
        let dom = kuchiki::parse_html().one(content);

        RoseyPage {
            dom,
            edits: Vec::new(),
            link_tags: Vec::new(),
            image_tags: Vec::new(),
            assets: Vec::new(),
            separator: separator.to_string(),
            tag: tag.to_string(),
            meta_tag: None,
        }
    }

    pub fn prepare(&mut self) {
        let dom = self.dom.clone();
        self.process_node(&dom, None, None);
        self.process_image_tags();
        self.process_assets();
    }

    pub fn rewrite_html(&mut self, locale: &RoseyLocale) {
        for edit in self.edits.iter() {
            match edit {
                RoseyEdit::Content(key, original, node) => {
                    node.children().for_each(|child| {
                        child.detach();
                    });

                    if let Some(content) = locale.get(key) {
                        node.append(NodeRef::new_text(content));
                    } else {
                        node.append(NodeRef::new_text(original));
                    }
                }
                RoseyEdit::Attribute(key, attr, original, node) => {
                    let mut attributes = node.as_element().unwrap().attributes.borrow_mut();

                    if let Some(value) = locale.get(key) {
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

    pub fn rewrite_assets(&mut self, assets_source: &Path, locale: &str) {
        for (attr, original, node) in self.assets.iter() {
            let mut attributes = node.as_element().unwrap().attributes.borrow_mut();
            if let Some(translated_asset) =
                self.get_translated_asset(original, assets_source, locale)
            {
                attributes.insert(attr.as_str(), format!("/{translated_asset}"));
            } else {
                attributes.insert(attr.as_str(), original.clone());
            }
        }
    }

    pub fn rewrite_image_tags(&mut self, images_source: &Path, locale: &str) {
        for (original_src, original_srcset, img) in self.image_tags.iter() {
            let mut attributes = img.as_element().unwrap().attributes.borrow_mut();
            if let Some(original) = original_src {
                if let Some(translated_asset) =
                    self.get_translated_asset(original, images_source, locale)
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
                                self.get_translated_asset(src, images_source, locale)
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

    fn get_translated_asset(&self, original: &str, source: &Path, locale: &str) -> Option<String> {
        let original_path = Path::new(original);
        if let Some(ext) = original_path.extension() {
            let mut translated_asset = PathBuf::from(original_path);
            translated_asset.set_extension(format!("{locale}.{}", ext.to_str().unwrap()));
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

    pub fn prepare_head(&mut self, locales_count: usize) {
        let head = if let Ok(head) = self.dom.select_first("head") {
            head
        } else {
            let head = NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("input")),
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

        let node = NodeRef::new_element(
            QualName::new(None, ns!(html), local_name!("meta")),
            attributes,
        );
        self.meta_tag = Some(node.clone());
        head.append(node);

        for _i in 0..locales_count {
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
            head.append(node.clone());
        }
    }

    pub fn rewrite_meta_tags(
        &mut self,
        locale: &str,
        relative_path: &Path,
        locales: &HashMap<String, RoseyLocale>,
        default_language: &str,
    ) {
        let path = relative_path.display().to_string();
        let path = path.trim_end_matches("index.html");

        let meta_tag = self.meta_tag.as_ref().unwrap();
        let mut attributes = meta_tag.as_element().unwrap().attributes.borrow_mut();

        attributes.remove("content");
        attributes.insert("content", locale.to_string());

        for (i, key) in locales
            .iter()
            .map(|(key, _)| key.as_str())
            .chain(std::iter::once(default_language))
            .filter(|key| *key != locale)
            .enumerate()
        {
            let mut attributes = self.link_tags[i]
                .as_element()
                .unwrap()
                .attributes
                .borrow_mut();
            attributes.remove("hreflang");
            attributes.remove("href");
            attributes.insert("hreflang", String::from(key));
            attributes.insert("href", format!("/{key}/{path}"));
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
        let (root, namespace) = if let Some(element) = node.as_element() {
            let prefix = match (&root, &namespace) {
                (Some(root), _) => {
                    if root.is_empty() {
                        String::default()
                    } else {
                        format!("{}{}", root, self.separator)
                    }
                }
                (None, Some(namespace)) => format!("{}{}", namespace, self.separator),
                _ => String::default(),
            };

            let attributes = element.attributes.borrow();

            if let Some(key) = attributes.get(&self.tag[..]) {
                let content = node.to_string();
                let key = if key.is_empty() {
                    let hash = {
                        let mut hasher = Sha256::new();
                        hasher.update(&content);
                        encode_config(
                            hasher.finalize(),
                            Config::new(CharacterSet::Standard, false),
                        )
                    };
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

                self.edits
                    .push(RoseyEdit::Content(key, content, node.clone()));
            }

            if let Some(attrs_map) = attributes.get(format!("{}-attrs-explicit", self.tag)) {
                let attrs_map: HashMap<String, String> = serde_json::from_str(attrs_map).unwrap();
                for (attr, key) in attrs_map.iter() {
                    self.edits.push(RoseyEdit::Attribute(
                        format!("{}{}", prefix, key),
                        attr.to_string(),
                        attributes.get(attr.as_str()).map(String::from),
                        node.clone(),
                    ));
                }
            }

            let new_root = attributes
                .get(format!("{}-root", self.tag))
                .map(String::from)
                .or(root);

            let new_namespace = match (namespace, attributes.get(format!("{}-ns", self.tag))) {
                (Some(namespace), Some(new_namespace)) => {
                    Some(format!("{}:{}", namespace, new_namespace))
                }
                (Some(namespace), None) => Some(namespace),
                (None, Some(new_namespace)) => Some(String::from(new_namespace)),
                _ => None,
            };

            (new_root, new_namespace)
        } else {
            (root, namespace)
        };

        for child in node.children() {
            self.process_node(&child, root.clone(), namespace.clone());
        }
    }

    pub fn output_file(&self, output_path: &Path, overwrite: bool) {
        if let Some(parent) = output_path.parent() {
            create_dir_all(parent).unwrap();
        }

        let mut open_options = OpenOptions::new();
        let open_options = open_options
            .write(true)
            .create(true)
            .truncate(true)
            .create_new(!overwrite);

        if let Ok(file) = open_options.open(&output_path) {
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

struct RoseySerializer<Wr: Write> {
    serializer: HtmlSerializer<Wr>,
}

impl<Wr: Write> RoseySerializer<Wr> {
    pub fn new(writer: Wr) -> Self {
        RoseySerializer {
            serializer: HtmlSerializer::new(
                writer,
                SerializeOpts {
                    traversal_scope: html5ever::serialize::TraversalScope::IncludeNode,
                    ..Default::default()
                },
            ),
        }
    }
}

impl<Wr: Write> Serializer for RoseySerializer<Wr> {
    fn start_elem<'a, AttrIter>(&mut self, name: QualName, attrs: AttrIter) -> std::io::Result<()>
    where
        AttrIter: Iterator<Item = html5ever::serialize::AttrRef<'a>>,
    {
        self.serializer.start_elem(name, attrs)
    }

    fn end_elem(&mut self, name: QualName) -> std::io::Result<()> {
        self.serializer.end_elem(name)
    }

    fn write_text(&mut self, text: &str) -> std::io::Result<()> {
        self.serializer.writer.write_all(text.as_bytes())
    }

    fn write_comment(&mut self, text: &str) -> std::io::Result<()> {
        self.serializer.write_comment(text)
    }

    fn write_doctype(&mut self, name: &str) -> std::io::Result<()> {
        self.serializer.write_doctype(name)
    }

    fn write_processing_instruction(&mut self, target: &str, data: &str) -> std::io::Result<()> {
        self.serializer.write_processing_instruction(target, data)
    }
}
