use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::{Path, PathBuf},
    str::FromStr,
};

use base64::{encode_config, CharacterSet, Config};
use globwalk::DirEntry;
use kuchiki::{traits::TendrilSink, NodeRef};
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

        self.output_static_files();
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

        for (key, locale) in (&self.locales).into_iter() {
            let content = self.rewrite_file(&file, locale);
            self.output_file(key, relative_path, content)
        }

        let content = read_to_string(file.path()).unwrap();
        self.output_file(&self.default_language, relative_path, content);
    }

    pub fn output_file(&self, locale: &str, relative_path: &Path, content: String) {
        let dest_folder = self.working_directory.join(&self.dest).join(locale);
        create_dir_all(&dest_folder).unwrap();
        let dest_path = dest_folder.join(&relative_path);
        write(dest_path, content).unwrap();
    }

    pub fn rewrite_file(&self, file: &DirEntry, locale: &RoseyLocale) -> String {
        let dom = kuchiki::parse_html().one(read_to_string(file.path()).unwrap());
        self.process_node(&dom, None, None, locale);
        return dom.to_string();
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

    pub fn output_static_files(&mut self) {
        let dest_folder = self.working_directory.join(&self.dest);
        let dest_index = dest_folder.join("index.html");
        create_dir_all(dest_folder).unwrap();
        let output = format!(
            r#"
            <html>
                <head>
                    <title>Redirecting...</title>
                </head>
                <body>
                    <a href="/{}/">Click here if you are not redirected.</a>
                </body>
            </html>
            "#,
            self.default_language
        );
        write(dest_index, output).unwrap();
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
