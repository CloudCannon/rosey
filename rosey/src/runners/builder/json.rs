use crate::RoseyTranslation;

use super::RoseyBuilder;

use std::{
    fs::read_to_string,
    mem::discriminant,
    path::{Path, PathBuf},
};

use rayon::prelude::*;
use serde_json::Value;

impl RoseyBuilder {
    pub fn process_json_file(&self, file: &Path) {
        let config = &self.options.config;
        let mut schema_path = PathBuf::from(file);
        schema_path.set_extension("rosey.json");
        if !schema_path.exists() {
            return;
        }

        let content = read_to_string(file).unwrap();
        let source = serde_json::from_str::<Value>(&content);
        let schema = serde_json::from_str::<Value>(&read_to_string(&schema_path).unwrap());

        if source.is_err() {
            eprintln!("Failed to parse {file:?}");
            return;
        }

        if schema.is_err() {
            eprintln!("Failed to parse {schema_path:?}");
            return;
        }

        let source = source.unwrap();
        let schema = schema.unwrap();

        let source_folder = &config.source;
        let relative_path = file.strip_prefix(source_folder).unwrap();

        self.output_file(&config.default_language, relative_path, content);

        self.translations.par_iter().for_each(|(key, translation)| {
            let mut source = source.clone();
            RoseyBuilder::process_json_node(&mut source, &schema, None, translation);

            let content = serde_json::to_string_pretty(&source).unwrap();
            self.output_file(key, relative_path, content);
        });
    }

    fn process_json_node(
        source: &mut Value,
        schema: &Value,
        namespace: Option<String>,
        translation: &RoseyTranslation,
    ) {
        if discriminant(source) != discriminant(schema) {
            eprintln!("Schema mismatch");
            return;
        }

        match (source, schema) {
            (Value::Object(source_map), Value::Object(schema_map)) => {
                let mut namespace = namespace.unwrap_or_default();
                let keys = source_map.keys().cloned().collect::<Vec<_>>();
                keys.iter().for_each(|key| {
                    if let (Some(Value::String(source_value)), Some(Value::String(schema_value))) =
                        (source_map.get_mut(key), schema_map.get(key))
                    {
                        schema_value.trim().split('|').for_each(|part| {
                            if part == "rosey-ns" {
                                namespace.push_str(&source_value.to_lowercase());
                                namespace.push('.');
                            } else if part.starts_with("rosey:") {
                                let locale_key = format!(
                                    "{}{}",
                                    namespace,
                                    part.strip_prefix("rosey:").unwrap()
                                );

                                if let Some(value) = translation.get(&locale_key) {
                                    *source_value = value.clone();
                                }
                            }
                        });
                    } else if let (Some(source_value), Some(schema_value)) =
                        (source_map.get_mut(key), schema_map.get(key))
                    {
                        RoseyBuilder::process_json_node(
                            source_value,
                            schema_value,
                            Some(namespace.clone()),
                            translation,
                        )
                    }
                })
            }
            (Value::Array(source_array), Value::Array(schema_array)) => {
                let namespace = namespace.unwrap_or_default();
                let mut array_namespace = false;
                let mut key = None;

                match schema_array.first() {
                    Some(Value::String(schema_value)) => {
                        schema_value.trim().split('|').for_each(|part| {
                            if part == "rosey-array-ns" {
                                array_namespace = true;
                            } else if part.starts_with("rosey:") {
                                key = part.strip_prefix("rosey:").map(String::from);
                            }
                        });

                        source_array.iter_mut().for_each(|source_value| {
                            if let Value::String(source_value) = source_value {
                                let mut locale_key = namespace.clone();
                                if array_namespace {
                                    locale_key.push_str(source_value);
                                    locale_key.push('.');
                                }
                                locale_key.push_str(key.as_ref().unwrap());

                                if let Some(value) = translation.get(&locale_key) {
                                    *source_value = value.clone();
                                }
                            } else {
                                eprintln!("Schema mismatch in array: Expected String");
                            }
                        })
                    }
                    Some(schema_value) => source_array.iter_mut().for_each(|source_value| {
                        RoseyBuilder::process_json_node(
                            source_value,
                            schema_value,
                            None,
                            translation,
                        )
                    }),
                    _ => eprintln!("Schema mismatch in array: Expected String|Object"),
                }
            }
            _ => (),
        }
    }
}
