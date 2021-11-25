use std::{
    collections::HashMap,
    fs::{create_dir_all, read_to_string, write},
    path::PathBuf,
};

use base64::{encode_config, CharacterSet, Config};
use globwalk::DirEntry;
use kuchiki::{traits::TendrilSink, NodeRef};
use sha2::{Digest, Sha256};

use crate::RoseyRunner;

pub struct RoseyGenerator {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub version: u8,
    pub tag: String,
    pub separator: String,
    pub locale_dest: PathBuf,
    pub locale: HashMap<String, String>,
}

impl From<RoseyRunner> for RoseyGenerator {
    fn from(runner: RoseyRunner) -> Self {
        RoseyGenerator {
            working_directory: runner.working_directory,
            source: runner.source,
            version: runner.version,
            tag: runner.tag,
            separator: runner.separator,
            locale_dest: runner.locale_dest,
            locale: HashMap::default(),
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
        write(locale_dest, format!("{:?}", self.locale)).unwrap();
    }

    fn process_file(&mut self, file: DirEntry) {
        let dom = kuchiki::parse_html().one(read_to_string(file.path()).unwrap());
        self.process_node(dom, None, None);
    }

    fn process_node(&mut self, node: NodeRef, root: Option<String>, namespace: Option<String>) {
        let (root, namespace) = if let Some(element) = node.as_element() {
            let attributes = element.attributes.borrow();
            if let Some(key) = attributes.get("data-rosey") {
                let key = match (&root, &namespace, key) {
                    (_, _, "") => {
                        let mut hasher = Sha256::new();
                        hasher.update(node.to_string());
                        encode_config(
                            hasher.finalize(),
                            Config::new(CharacterSet::Standard, false),
                        )
                    }
                    (Some(root), _, _) => {
                        if root.is_empty() {
                            String::from(key)
                        } else {
                            format!("{}:{}", root, key)
                        }
                    }
                    (None, Some(namespace), _) => format!("{}:{}", namespace, key),
                    _ => String::from(key),
                };

                if let Some(attrs) = attributes.get("data-rosey-attrs") {
                    for attr in attrs.split(',') {
                        if let Some(value) = attributes.get(attr) {
                            self.locale
                                .insert(format!("{}.{}", key, attr), String::from(value));
                        }
                    }
                }

                if let Some(attrs_map) = attributes.get("data-rosey-attrs-explicit") {
                    let attrs_map: HashMap<String, String> =
                        serde_json::from_str(attrs_map).unwrap();
                    for (attr, key) in attrs_map.iter() {
                        if let Some(value) = attributes.get(attr.as_str()) {
                            self.locale.insert(key.clone(), String::from(value));
                        }
                    }
                }

                self.locale.insert(key, node.text_contents());
            }

            let new_root = attributes.get("data-rosey-root").map(String::from).or(root);

            let new_namespace = match (namespace, attributes.get("data-rosey-ns")) {
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
