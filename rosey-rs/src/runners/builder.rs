mod redirect_page;

use std::{
    collections::{BTreeMap, HashMap},
    fs::{create_dir_all, read_to_string, write},
    path::{Path, PathBuf},
    str::FromStr,
};

use base64::{encode_config, CharacterSet, Config};
use globwalk::DirEntry;
use kuchiki::{traits::TendrilSink, Attribute, ExpandedName, NodeRef};
use markup5ever::{local_name, namespace_url, ns, QualName};
use sha2::{Digest, Sha256};

use crate::{RoseyLocale, RoseyOptions};

pub struct RoseyBuilder {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub locale_source: PathBuf,
    pub dest: PathBuf,
    pub tag: String,
    pub default_language: String,
    pub locales: HashMap<String, RoseyLocale>,
    pub separator: String,
    pub redirect_page: Option<PathBuf>,
}

impl From<RoseyOptions> for RoseyBuilder {
    fn from(runner: RoseyOptions) -> Self {
        RoseyBuilder {
            working_directory: runner.working_directory,
            source: runner.source.unwrap(),
            locale_source: runner.locale_source.unwrap(),
            dest: runner.dest.unwrap(),
            tag: runner.tag.unwrap(),
            default_language: runner.default_language.unwrap(),
            locales: HashMap::default(),
            separator: runner.separator.unwrap(),
            redirect_page: runner.redirect_page,
        }
    }
}

impl RoseyBuilder {
    pub fn run(&mut self) {
        self.read_locales();

        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.source),
            &["*.{htm,html}"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok);

        walker.for_each(|file| self.process_file(file));
    }

    pub fn read_locales(&mut self) {
        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.locale_source),
            &["*.json"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok);

        walker.for_each(|file| {
            let locale = file
                .path()
                .file_stem()
                .unwrap()
                .to_string_lossy()
                .to_string();
            let value = read_to_string(file.path()).expect("Failed to read locale file");
            let value = RoseyLocale::from_str(&value);
            if let Ok(value) = value {
                self.locales.insert(locale, value);
            }
        });
    }

    pub fn process_file(&mut self, file: DirEntry) {
        let source_folder = self.working_directory.join(&self.source);
        let relative_path = file.path().strip_prefix(&source_folder).unwrap();
        let content = read_to_string(file.path()).unwrap();

        for (key, locale) in (&self.locales).iter() {
            let dom = kuchiki::parse_html().one(content.clone());
            self.rewrite_file(&dom, locale);
            self.add_meta_tags(&dom, key, relative_path);

            let content = dom.to_string();
            self.output_file(key, relative_path, content);
            self.output_redirect_file(key, relative_path);
        }

        let dom = kuchiki::parse_html().one(content);
        self.add_meta_tags(&dom, &self.default_language, relative_path);

        let content = dom.to_string();
        self.output_file(&self.default_language, relative_path, content);
        self.output_redirect_file(&self.default_language, relative_path);
    }

    pub fn add_meta_tags(&self, dom: &NodeRef, locale: &str, relative_path: &Path) {
        let path = relative_path.display().to_string();
        let path = path.trim_end_matches("index.html");
        let head = if let Ok(head) = dom.select_first("head") {
            head
        } else {
            let head = NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("input")),
                BTreeMap::default(),
            );
            dom.prepend(head);
            dom.select_first("head").unwrap()
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
        attributes.insert(
            ExpandedName::new("", "content"),
            Attribute {
                prefix: None,
                value: String::from(locale),
            },
        );

        head.append(NodeRef::new_element(
            QualName::new(None, ns!(html), local_name!("meta")),
            attributes,
        ));

        for key in (&self.locales)
            .iter()
            .map(|(key, _)| key)
            .chain(std::iter::once(&self.default_language))
            .filter(|key| *key != locale)
        {
            let mut attributes = BTreeMap::new();
            attributes.insert(
                ExpandedName::new("", "rel"),
                Attribute {
                    prefix: None,
                    value: String::from("alternate"),
                },
            );
            attributes.insert(
                ExpandedName::new("", "hreflang"),
                Attribute {
                    prefix: None,
                    value: String::from(key),
                },
            );
            attributes.insert(
                ExpandedName::new("", "href"),
                Attribute {
                    prefix: None,
                    value: format!("/{key}/{path}"),
                },
            );
            head.append(NodeRef::new_element(
                QualName::new(None, ns!(html), local_name!("link")),
                attributes,
            ));
        }
    }

    pub fn output_file(&self, locale: &str, relative_path: &Path, content: String) {
        let dest_folder = self.working_directory.join(&self.dest).join(locale);
        let dest_path = dest_folder.join(&relative_path);
        if let Some(parent) = dest_path.parent() {
            create_dir_all(parent).unwrap();
        }
        write(dest_path, content).unwrap();
    }

    pub fn rewrite_file(&self, dom: &NodeRef, locale: &RoseyLocale) {
        self.process_node(dom, None, None, locale);
    }

    fn process_node(
        &self,
        node: &NodeRef,
        root: Option<String>,
        namespace: Option<String>,
        locale: &RoseyLocale,
    ) {
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

            let hash = {
                let mut hasher = Sha256::new();
                hasher.update(node.to_string());
                encode_config(
                    hasher.finalize(),
                    Config::new(CharacterSet::Standard, false),
                )
            };

            let mut attributes = element.attributes.borrow_mut();

            if let Some(key) = attributes.get(&self.tag[..]) {
                let key = if key.is_empty() {
                    format!("{}{}", &prefix, hash)
                } else {
                    format!("{}{}", &prefix, key)
                };

                let attrs = attributes.remove(format!("{}-attrs", self.tag));
                if let Some(attrs) = attrs {
                    for attr in attrs.value.split(',') {
                        if let Some(value) = locale.get(&format!("{}.{}", key, attr)) {
                            attributes.remove(attr);
                            attributes.insert(attr, value.clone());
                        }
                    }
                    attributes.insert(format!("{}-attrs", self.tag), attrs.value);
                }

                if let Some(value) = locale.get(&key) {
                    replace_content(node, value)
                }
            }

            if let Some(attrs_map) = attributes.get(format!("{}-attrs-explicit", self.tag)) {
                let attrs_map: HashMap<String, String> = serde_json::from_str(attrs_map).unwrap();
                for (attr, key) in attrs_map.iter() {
                    if let Some(value) = locale.get(&format!("{}{}", prefix, key)) {
                        attributes.remove(attr.as_str());
                        attributes.insert(attr.as_str(), value.clone());
                    }
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
            self.process_node(&child, root.clone(), namespace.clone(), locale);
        }
    }

    pub fn output_redirect_file(&self, locale: &str, relative_path: &Path) {
        let dest_folder = self.working_directory.join(&self.dest);
        let dest_file = dest_folder.join(relative_path);
        let path = relative_path.display().to_string();
        let path = path.trim_end_matches("index.html");

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

        write(dest_file, output).unwrap();
    }
}

pub fn replace_content(node: &NodeRef, content: &str) {
    node.children().for_each(|child| {
        child.detach();
    });

    let dom = kuchiki::parse_html().one(format!(
        "<html><head></head><body>{}</body></html>",
        content
    ));

    dom.select_first("body")
        .unwrap()
        .as_node()
        .children()
        .for_each(|child| {
            child.detach();
            node.append(child);
        });
}
