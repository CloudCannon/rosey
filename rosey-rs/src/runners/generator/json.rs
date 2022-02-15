use super::RoseyGenerator;

use std::{
    fs::read_to_string,
    mem::discriminant,
    path::{Path, PathBuf},
};

use serde_json::Value;

impl RoseyGenerator {
    pub fn process_json_file(&mut self, file: &Path) {
        let mut schema_path = PathBuf::from(file);
        schema_path.set_extension("rosey.json");
        if !schema_path.exists() {
            return;
        }

        let source = serde_json::from_str::<Value>(&read_to_string(&file).unwrap());
        let schema = serde_json::from_str::<Value>(&read_to_string(&schema_path).unwrap());

        if source.is_err() {
            eprintln!("Failed to parse {file:?}");
            return;
        }

        if schema.is_err() {
            eprintln!("Failed to parse {schema_path:?}");
            return;
        }

        self.current_file = String::from(
            file.strip_prefix(self.working_directory.join(&self.source))
                .unwrap()
                .to_str()
                .unwrap(),
        );

        self.process_json_node(&source.unwrap(), &schema.unwrap(), None)
    }

    fn process_json_node(&mut self, source: &Value, schema: &Value, namespace: Option<String>) {
        if discriminant(source) != discriminant(schema) {
            eprintln!("Schema mismatch");
            return;
        }

        match (source, schema) {
            (Value::Object(source_map), Value::Object(schema_map)) => {
                let mut namespace = namespace.unwrap_or_default();
                source_map.keys().for_each(|key| {
                    if let (Some(Value::String(source_value)), Some(Value::String(schema_value))) =
                        (source_map.get(key), schema_map.get(key))
                    {
                        let mut key: Option<String> = None;
                        schema_value.trim().split('|').for_each(|part| {
                            if part == "rosey-ns" {
                                namespace.push_str(&source_value.to_lowercase());
                                namespace.push('.');
                            } else if part.starts_with("rosey:") {
                                key = part.strip_prefix("rosey:").map(String::from);
                            }
                        });
                        self.locale.insert(
                            format!("{}{}", namespace, key.unwrap()),
                            String::from(source_value),
                            &self.current_file,
                        );
                    } else if let (Some(source_value), Some(schema_value)) =
                        (source_map.get(key), schema_map.get(key))
                    {
                        self.process_json_node(source_value, schema_value, Some(namespace.clone()))
                    }
                })
            }
            (Value::Array(source_array), Value::Array(schema_array)) => {
                let namespace = namespace.unwrap_or_default();
                let mut array_namespace = false;
                let mut key = None;

                match schema_array.get(0) {
                    Some(Value::String(schema_value)) => {
                        schema_value.trim().split('|').for_each(|part| {
                            if part == "rosey-array-ns" {
                                array_namespace = true;
                            } else if part.starts_with("rosey:") {
                                key = part.strip_prefix("rosey:").map(String::from);
                            }
                        });

                        source_array.iter().for_each(|source_value| {
                            if let Value::String(source_value) = source_value {
                                let mut locale_key = namespace.clone();
                                if array_namespace {
                                    locale_key.push_str(source_value);
                                    locale_key.push('.');
                                }
                                locale_key.push_str(key.as_ref().unwrap());
                                self.locale.insert(
                                    locale_key,
                                    String::from(source_value),
                                    &self.current_file,
                                );
                            } else {
                                eprintln!("Schema mismatch in array: Expected String")
                            }
                        })
                    }
                    Some(schema_value) => source_array.iter().for_each(|source_value| {
                        self.process_json_node(source_value, schema_value, None)
                    }),
                    _ => eprintln!("Schema mismatch in array: Expected String|Object"),
                }
            }
            _ => (),
        }
    }
}
