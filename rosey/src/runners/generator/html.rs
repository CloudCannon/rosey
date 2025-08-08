use base64::prelude::*;
use kuchiki::{traits::TendrilSink, NodeRef};
use path_slash::PathExt;
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fmt::Write, fs::read_to_string, path::Path};

use super::RoseyGenerator;

impl RoseyGenerator {
    pub fn process_html_file(&mut self, file: &Path) {
        let config = &self.options.config;
        let dom = kuchiki::parse_html().one(read_to_string(file).unwrap());
        crate::inline_templates(&dom);
        self.current_file = file
            .strip_prefix(&config.source)
            .unwrap()
            .to_slash_lossy()
            .into_owned();
        self.urls_locale
            .insert_uncounted(self.current_file.clone(), self.current_file.clone());
        self.process_html_node(dom, None, None);
    }

    fn process_html_node(
        &mut self,
        node: NodeRef,
        root: Option<String>,
        namespace: Option<String>,
    ) {
        let config = &self.options.config;
        let mut root = root;
        let mut namespace = namespace;

        if let Some(element) = node.as_element() {
            let attributes = element.attributes.borrow();
            let mut prefix = String::default();

            if let Some(new_root) = attributes.get(format!("{}-root", config.tag)) {
                root = Some(String::from(new_root));
                namespace = None;
            }

            if let Some(root) = &root {
                if !root.is_empty() {
                    write!(prefix, "{}{}", root, &config.separator)
                        .expect("Failed to write root to prefix");
                }
            }

            namespace = match (namespace, attributes.get(format!("{}-ns", config.tag))) {
                (Some(namespace), Some(new_namespace)) => Some(format!(
                    "{}{}{}",
                    namespace, &config.separator, new_namespace
                )),
                (Some(namespace), None) => Some(namespace),
                (None, Some(new_namespace)) => Some(String::from(new_namespace)),
                _ => None,
            };

            if let Some(namespace) = &namespace {
                write!(prefix, "{}{}", &namespace, &config.separator)
                    .expect("Failed to write namespace to prefix");
            }

            if let Some(key) = attributes.get(&config.tag[..]) {
                let key = if key.is_empty() {
                    let mut hasher = Sha256::new();
                    hasher.update(node.to_string());
                    let hash = BASE64_STANDARD_NO_PAD.encode(hasher.finalize());
                    format!("{}{}", &prefix, hash)
                } else {
                    format!("{}{}", &prefix, key)
                };

                if let Some(attrs) = attributes.get(format!("{}-attrs", config.tag)) {
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

            if let Some(attrs_map) = attributes.get(format!("{}-attrs-explicit", config.tag)) {
                let attrs_map: BTreeMap<String, String> = serde_json::from_str(attrs_map).expect("Failed to parse explicit attrs. Must be a JSON object with string keys and values.");
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
        };

        for child in node.children() {
            self.process_html_node(child, root.clone(), namespace.clone());
        }
    }
}
