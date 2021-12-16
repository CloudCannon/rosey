mod runners;

use crate::runners::generator::RoseyGenerator;
use runners::builder::RoseyBuilder;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, str::FromStr};

pub enum RoseyCommand {
    Generate,
    Build,
}

pub struct RoseyRunner {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub dest: PathBuf,
    pub version: u8,
    pub tag: String,
    pub separator: String,
    pub locale_source: PathBuf,
    pub locale_dest: PathBuf,
    pub default_locale: String,
}

impl RoseyRunner {
    pub fn new(
        working_directory: PathBuf,
        source: Option<String>,
        dest: Option<String>,
        version: Option<u8>,
        tag: Option<String>,
        separator: Option<String>,
        locale_dest: Option<PathBuf>,
        locale_source: Option<PathBuf>,
    ) -> RoseyRunner {
        RoseyRunner {
            working_directory,
            source: PathBuf::from(source.unwrap_or_else(|| String::from("."))),
            dest: PathBuf::from(dest.unwrap()),
            version: version.unwrap_or(2),
            tag: tag.unwrap_or_else(|| String::from("data-rosey")),
            separator: separator.unwrap_or_else(|| String::from(":")),
            locale_source: locale_source.unwrap_or_else(|| PathBuf::from("rosey/locales/")),
            locale_dest: locale_dest.unwrap_or_else(|| PathBuf::from("rosey/source.json")),
            default_locale: String::from("en"),
        }
    }

    pub fn run(self, command: RoseyCommand) {
        match command {
            RoseyCommand::Generate => RoseyGenerator::from(self).run(),
            RoseyCommand::Build => RoseyBuilder::from(self).run(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoseyTranslation {
    pub original: String,
    pub pages: HashMap<String, u32>,
    pub total: u32,
}

impl RoseyTranslation {
    pub fn new(original: String) -> RoseyTranslation {
        RoseyTranslation {
            original,
            pages: HashMap::default(),
            total: 0,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoseyLocale {
    pub version: u8,
    pub keys: HashMap<String, RoseyTranslation>,
}

impl Default for RoseyLocale {
    fn default() -> Self {
        RoseyLocale {
            version: 2,
            keys: HashMap::default(),
        }
    }
}

impl FromStr for RoseyLocale {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if let Ok(result) = serde_json::from_str(s) {
            return Ok(result);
        }

        if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(s) {
            let mut result = RoseyLocale::default();
            result.version = 1;

            map.iter().for_each(|(key, value)| {
                result
                    .keys
                    .insert(key.clone(), RoseyTranslation::new(value.clone()));
            });

            return Ok(result);
        }

        return Err(());
    }
}

impl RoseyLocale {
    pub fn insert(&mut self, key: String, value: String, page: &str) {
        let mut translation = self
            .keys
            .entry(key)
            .or_insert_with(|| RoseyTranslation::new(value));
        translation.total += 1;
        let page = translation.pages.entry(page.to_string()).or_insert(0);
        *page += 1;
    }

    pub fn get(&self, key: &str) -> Option<&String> {
        return self.keys.get(key).map(|entry| &entry.original);
    }

    pub fn output(&mut self, version: u8) -> String {
        match version {
            2 => serde_json::to_string(self).unwrap(),
            1 => self.output_v1(),
            _ => unreachable!(),
        }
    }

    pub fn output_v1(&mut self) -> String {
        let mut originals: HashMap<String, String> = HashMap::default();
        for (key, translation) in self.keys.iter() {
            originals.insert(key.clone(), translation.original.clone());
        }
        serde_json::to_string(&originals).unwrap()
    }
}
