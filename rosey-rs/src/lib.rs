mod runners;

use crate::runners::generator::RoseyGenerator;
use clap::ArgMatches;
use runners::builder::RoseyBuilder;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env, path::PathBuf, str::FromStr};

pub enum RoseyCommand {
    Generate,
    Build,
}

impl FromStr for RoseyCommand {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "generate" => Ok(RoseyCommand::Generate),
            "build" => Ok(RoseyCommand::Build),
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
    pub credentials: Option<String>,
    pub exclusions: Option<String>,
    pub images_source: Option<PathBuf>,
    pub default_language: Option<String>,
    pub source_delimiter: Option<String>,
    pub redirect_page: Option<PathBuf>,
    pub verbose: bool,
}

impl Default for RoseyOptions {
    fn default() -> Self {
        Self {
            working_directory: env::current_dir().unwrap(),
            source: Some(PathBuf::from("dist/site")),
            dest: Some(PathBuf::from("dist/translated_site")),
            version: Some(2),
            tag: Some("data-rosey".to_string()),
            separator: Some(":".to_string()),
            locale_dest: Some(PathBuf::from("rosey/source.json")),
            locale_source: Some(PathBuf::from("rosey/locales/")),
            languages: None,
            credentials: None,
            exclusions: Some(String::from(r#"\.(html?|json)$"#)),
            images_source: Some(PathBuf::from("source")),
            default_language: Some("en".to_string()),
            source_delimiter: None,
            redirect_page: None,
            verbose: false,
        }
    }
}

impl From<&ArgMatches<'_>> for RoseyOptions {
    fn from(matches: &ArgMatches) -> Self {
        RoseyOptions {
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
            images_source: matches
                .value_of("images-source")
                .or_else(|| matches.value_of("source"))
                .map(PathBuf::from),
            ..Default::default()
        }
    }
}

impl RoseyOptions {
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
            let mut result = RoseyLocale {
                version: 1,
                ..Default::default()
            };

            map.iter().for_each(|(key, value)| {
                result
                    .keys
                    .insert(key.clone(), RoseyTranslation::new(value.clone()));
            });

            return Ok(result);
        }

        Err(())
    }
}

impl RoseyLocale {
    pub fn insert(&mut self, key: String, value: String, page: &str) {
        let mut translation = self
            .keys
            .entry(key)
            .or_insert_with(|| RoseyTranslation::new(value));
        translation.total += 1;
        let page = translation
            .pages
            .entry(page.replace('\\', "/"))
            .or_insert(0);
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
