mod runners;

use crate::runners::generator::RoseyGenerator;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};

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
    pub locale_dest: PathBuf,
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
    ) -> RoseyRunner {
        RoseyRunner {
            working_directory,
            source: PathBuf::from(source.unwrap_or_else(|| String::from("."))),
            dest: PathBuf::from(dest.unwrap()),
            version: version.unwrap_or(2),
            tag: tag.unwrap_or_else(|| String::from("data-rosey")),
            separator: separator.unwrap_or_else(|| String::from(":")),
            locale_dest: locale_dest.unwrap_or_else(|| PathBuf::from("rosey/source.json")),
        }
    }

    pub fn run(self, command: RoseyCommand) {
        match command {
            RoseyCommand::Generate => RoseyGenerator::from(self).run(),
            _ => todo!(),
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
