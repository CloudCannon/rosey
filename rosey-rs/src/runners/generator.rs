use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
};

use base64::{encode_config, CharacterSet, Config};
use globwalk::DirEntry;
use kuchiki::{traits::TendrilSink, NodeRef};
use sha2::{Digest, Sha256};

use crate::{RoseyLocale, RoseyOptions};

pub struct RoseyGenerator {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub version: u8,
    pub tag: String,
    pub separator: String,
    pub locale_dest: PathBuf,
    pub locale: RoseyLocale,
    pub current_file: String,
}

impl From<RoseyOptions> for RoseyGenerator {
    fn from(runner: RoseyOptions) -> Self {
        RoseyGenerator {
            working_directory: runner.working_directory,
            source: runner.source.unwrap(),
            version: runner.version.unwrap(),
            tag: runner.tag.unwrap(),
            separator: runner.separator.unwrap(),
            locale_dest: runner.locale_dest.unwrap(),
            locale: RoseyLocale::default(),
            current_file: String::default(),
        }
    }
}

impl RoseyGenerator {
    pub fn run(&mut self) {
        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.source),
            &["*.{htm,html}"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok);

        walker.for_each(|file| self.process_file(file));

        self.output_locale();
    }

    fn output_locale(&mut self) {
        let locale_dest = self.working_directory.join(&self.locale_dest);
        let locale_folder = locale_dest.parent().unwrap();
        create_dir_all(locale_folder).unwrap();
        let output = self.locale.output(self.version);
        write(locale_dest, output).unwrap();
    }

    fn process_file(&mut self, file: DirEntry) {
        let dom = kuchiki::parse_html().one(read_to_string(file.path()).unwrap());
        self.current_file = String::from(
            file.path()
                .strip_prefix(self.working_directory.join(&self.source))
                .unwrap()
                .to_str()
                .unwrap(),
        );
        self.process_node(dom, None, None);
    }

    fn process_node(&mut self, node: NodeRef, root: Option<String>, namespace: Option<String>) {
        let (root, namespace) = if let Some(element) = node.as_element() {
            let attributes = element.attributes.borrow();
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

                if let Some(attrs) = attributes.get(format!("{}-attrs", self.tag)) {
                    for attr in attrs.split(',') {
                        if let Some(value) = attributes.get(attr) {
                            self.locale.insert(
                                format!("{}.{}", key, attr),
                                String::from(value),
                                &self.current_file,
                            );
                        }
                    }
                }

                let inner_html: String = node.children().map(|child| child.to_string()).collect();
                self.locale.insert(key, inner_html, &self.current_file);
            }

            if let Some(attrs_map) = attributes.get(format!("{}-attrs-explicit", self.tag)) {
                let attrs_map: HashMap<String, String> = serde_json::from_str(attrs_map).unwrap();
                for (attr, key) in attrs_map.iter() {
                    if let Some(value) = attributes.get(attr.as_str()) {
                        self.locale.insert(
                            format!("{}{}", prefix, key),
                            String::from(value),
                            &self.current_file,
                        );
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
            self.process_node(child, root.clone(), namespace.clone());
        }
    }
}
