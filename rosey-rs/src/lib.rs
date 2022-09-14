mod runners;

use crate::runners::generator::RoseyGenerator;
use clap::ArgMatches;
use runners::{builder::RoseyBuilder, checker::RoseyChecker};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, env, path::PathBuf, str::FromStr};

pub enum RoseyCommand {
    Generate,
    Build,
    Check,
}

impl FromStr for RoseyCommand {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "generate" => Ok(RoseyCommand::Generate),
            "build" => Ok(RoseyCommand::Build),
            "check" => Ok(RoseyCommand::Check),
            _ => Err(()),
        }
    }
}

pub struct RoseyOptions {
    pub working_directory: PathBuf,
    pub source: Option<PathBuf>,
    pub dest: Option<PathBuf>,
    pub version: Option<u8>,
    pub tag: Option<String>,
    pub separator: Option<String>,
    pub locale_dest: Option<PathBuf>,
    pub locale_source: Option<PathBuf>,
    pub languages: Option<Vec<String>>,
    pub exclusions: Option<String>,
    pub images_source: Option<PathBuf>,
    pub default_language: Option<String>,
    pub redirect_page: Option<PathBuf>,
    pub serve: bool,
    pub verbose: bool,
}

impl From<&ArgMatches<'_>> for RoseyOptions {
    fn from(matches: &ArgMatches) -> Self {
        RoseyOptions {
            working_directory: env::current_dir().unwrap(),
            source: matches.value_of("source").map(PathBuf::from),
            dest: matches.value_of("dest").map(PathBuf::from),
            version: matches.value_of("version").map(|s| s.parse().unwrap()),
            tag: matches.value_of("tag").map(String::from),
            separator: matches.value_of("separator").map(String::from),
            locale_source: matches.value_of("locale-source").map(PathBuf::from),
            locale_dest: matches.value_of("locale-dest").map(PathBuf::from),
            default_language: matches.value_of("default-language").map(String::from),
            redirect_page: matches.value_of("redirect-page").map(PathBuf::from),
            exclusions: matches.value_of("exclusions").map(String::from),
            images_source: matches.value_of("images-source").map(PathBuf::from),
            serve: matches.is_present("serve"),
            verbose: matches.is_present("verbose"),
            languages: None,
        }
    }
}

impl RoseyOptions {
    pub async fn run(self, command: RoseyCommand) {
        match command {
            RoseyCommand::Generate => RoseyGenerator::from(self).run(),
            RoseyCommand::Build => RoseyBuilder::from(self).run().await,
            RoseyCommand::Check => RoseyChecker::from(self).run(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RoseyTranslationEntry {
    pub original: Option<String>,
    pub value: Option<String>,
    pub pages: Option<BTreeMap<String, u32>>,
    pub total: Option<u32>,
}

impl RoseyTranslationEntry {
    pub fn new(original: String) -> RoseyTranslationEntry {
        RoseyTranslationEntry {
            original: Some(original),
            pages: Some(BTreeMap::default()),
            total: Some(0),
            value: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum RoseyTranslation {
    V1(BTreeMap<String, String>),
    V2(BTreeMap<String, RoseyTranslationEntry>),
}

impl RoseyTranslation {
    pub fn insert(&mut self, key: String, value: String, page: &str) {
        match self {
            RoseyTranslation::V1(keys) => {
                keys.insert(key, value);
            }
            RoseyTranslation::V2(keys) => {
                let translation = keys
                    .entry(key)
                    .or_insert_with(|| RoseyTranslationEntry::new(value));

                if let RoseyTranslationEntry {
                    total: Some(total),
                    pages: Some(pages),
                    ..
                } = translation
                {
                    *total += 1;
                    let page = pages.entry(page.replace('\\', "/")).or_insert(0);
                    *page += 1;
                }
            }
        }
    }

    pub fn get(&self, key: &str) -> Option<&String> {
        match self {
            RoseyTranslation::V1(keys) => keys.get(key),
            RoseyTranslation::V2(keys) => {
                if let Some(RoseyTranslationEntry { value, .. }) = keys.get(key) {
                    return value.as_ref();
                }
                None
            }
        }
    }

    pub fn len(&self) -> usize {
        match self {
            RoseyTranslation::V1(keys) => keys.len(),
            RoseyTranslation::V2(keys) => keys.len(),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn remove(&mut self, key: &str) {
        match self {
            RoseyTranslation::V1(keys) => {
                keys.remove(key);
            }
            RoseyTranslation::V2(keys) => {
                keys.remove(key);
            }
        };
    }

    pub fn normalize(&self) -> BTreeMap<String, RoseyTranslationEntry> {
        match self {
            RoseyTranslation::V1(keys) => keys
                .iter()
                .map(|(key, value)| {
                    (
                        key.clone(),
                        RoseyTranslationEntry {
                            value: Some(value.clone()),
                            original: None,
                            total: None,
                            pages: None,
                        },
                    )
                })
                .collect(),
            RoseyTranslation::V2(keys) => keys.clone(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RoseyLocale {
    pub version: u8,
    pub keys: RoseyTranslation,
}

impl Default for RoseyLocale {
    fn default() -> Self {
        RoseyLocale {
            version: 2,
            keys: RoseyTranslation::V2(BTreeMap::default()),
        }
    }
}

impl FromStr for RoseyLocale {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if let Ok(result) = serde_json::from_str(s) {
            return Ok(result);
        }

        if let Ok(keys) = serde_json::from_str(s) {
            return Ok(RoseyLocale { version: 1, keys });
        }

        Err(())
    }
}

impl RoseyLocale {
    pub fn new(version: u8) -> RoseyLocale {
        RoseyLocale {
            version,
            keys: match version {
                2 => RoseyTranslation::V2(BTreeMap::default()),
                1 => RoseyTranslation::V1(BTreeMap::default()),
                _ => unreachable!("Unsupported version"),
            },
        }
    }

    pub fn insert(&mut self, key: String, value: String, page: &str) {
        self.keys.insert(key, value, page);
    }

    pub fn output(&mut self, version: u8) -> String {
        match version {
            2 => serde_json::to_string(self).unwrap(),
            1 => serde_json::to_string(&self.keys).unwrap(),
            _ => unreachable!(),
        }
    }
}
