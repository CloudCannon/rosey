use crate::RoseyLocale;

use super::RoseyBuilder;

use std::{
    fs::read_to_string,
    mem::discriminant,
    path::{Path, PathBuf},
};

use serde_json::Value;

impl RoseyBuilder {
    pub fn process_json_file(&mut self, file: &Path) {
        let mut schema_path = PathBuf::from(file);
        schema_path.set_extension("rosey.json");
        if !schema_path.exists() {
            return;
        }

        let content = read_to_string(&file).unwrap();
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

        let mut source = source.unwrap();
        let schema = schema.unwrap();

        let source_folder = self.working_directory.join(&self.source);
        let relative_path = file.strip_prefix(&source_folder).unwrap();

        self.output_file(&self.default_language, relative_path, content);

        for (key, locale) in (&self.locales).iter() {
            self.process_json_node(&mut source, &schema, None, locale);

            let content = serde_json::to_string(&source).unwrap();
            self.output_file(key, relative_path, content);
        }
    }

    fn process_json_node(
        &self,
        source: &mut Value,
        schema: &Value,
        namespace: Option<String>,
        locale: &RoseyLocale,
    ) {
        if discriminant(source) != discriminant(schema) {
            eprintln!("Schema mismatch");
            return;
        }

        match (source, schema) {
            (Value::Object(source_map), Value::Object(schema_map)) => {
                let namespace = namespace.unwrap_or_default();
                let mut local_namespace = String::default();
                let keys = source_map.keys().cloned().collect::<Vec<_>>();
                keys.iter().for_each(|key| {
                    if let (Some(Value::String(source_value)), Some(Value::String(schema_value))) =
                        (source_map.get_mut(key), schema_map.get(key))
                    {
                        let mut key: Option<String> = None;
                        schema_value.trim().split('|').for_each(|part| {
                            if part == "rosey-ns" {
                                local_namespace = source_value.to_lowercase();
                                local_namespace.push('.');
                            } else if part.starts_with("rosey:") {
                                key = part.strip_prefix("rosey:").map(String::from);
                            }
                        });

                        let locale_key =
                            format!("{}{}{}", namespace, local_namespace, key.unwrap());

                        if let Some(value) = locale.get(&locale_key) {
                            *source_value = value.clone();
                        }
                    } else if let (Some(source_value), Some(schema_value)) =
                        (source_map.get_mut(key), schema_map.get(key))
                    {
                        self.process_json_node(
                            source_value,
                            schema_value,
                            Some(format!("{}{}", namespace, local_namespace)),
                            locale,
                        )
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

                        source_array.iter_mut().for_each(|source_value| {
                            if let Value::String(source_value) = source_value {
                                let mut locale_key = namespace.clone();
                                if array_namespace {
                                    locale_key.push_str(source_value);
                                    locale_key.push('.');
                                }
                                locale_key.push_str(key.as_ref().unwrap());

                                if let Some(value) = locale.get(&locale_key) {
                                    *source_value = value.clone();
                                }
                            } else {
                                eprintln!("Schema mismatch in array: Expected String");
                            }
                        })
                    }
                    Some(schema_value) => source_array.iter_mut().for_each(|source_value| {
                        self.process_json_node(source_value, schema_value, None, locale)
                    }),
                    _ => eprintln!("Schema mismatch in array: Expected String|Object"),
                }
            }
            _ => (),
        }
    }
}
