mod runners;

use crate::runners::generator::RoseyGenerator;
use clap::ArgMatches;
use cucumber::gherkin::Table;
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
    pub images_source: Option<String>,
    pub default_language: Option<String>,
    pub source_delimiter: Option<String>,
    pub redirect_page: Option<String>,
    pub verbose: bool,
}

impl Default for RoseyOptions {
    fn default() -> Self {
        Self {
            working_directory: env::current_dir().unwrap(),
            source: Some(PathBuf::from("source")),
            dest: Some(PathBuf::from("dest")),
            version: Some(2),
            tag: Some("data-rosey".to_string()),
            separator: Some(":".to_string()),
            locale_dest: Some(PathBuf::from("rosey/source.json")),
            locale_source: Some(PathBuf::from("rosey/locales/")),
            languages: None,
            credentials: None,
            exclusions: None,
            images_source: None,
            default_language: Some("en".to_string()),
            source_delimiter: None,
            redirect_page: None,
            verbose: false,
        }
    }
}

impl From<&Table> for RoseyOptions {
    fn from(step_table: &Table) -> Self {
        let mut options = RoseyOptions::default();
        for row in &step_table.rows {
            match row[0].as_ref() {
                "source" => options.source = Some(PathBuf::from(row[1].clone())),
                "dest" => options.dest = Some(PathBuf::from(row[1].clone())),
                "version" => {
                    options.version = Some(row[1].parse().expect("Version needs to be an integer"))
                }
                "tag" => options.tag = Some(row[1].clone()),
                "separator" => options.separator = Some(row[1].clone()),
                "locale-dest" => options.locale_dest = Some(PathBuf::from(row[1].clone())),
                "locale-source" => options.locale_source = Some(PathBuf::from(row[1].clone())),
                "languages" => {
                    options.languages =
                        Some(row[1].clone().split(',').map(|s| s.to_string()).collect())
                }
                "credentials" => options.credentials = Some(row[1].clone()),
                "exclusions" => options.exclusions = Some(row[1].clone()),
                "images-source" => options.images_source = Some(row[1].clone()),
                "default-language" => options.default_language = Some(row[1].clone()),
                "source-delimiter" => options.source_delimiter = Some(row[1].clone()),
                "redirect-page" => options.redirect_page = Some(row[1].clone()),
                "verbose" => options.verbose = row[1].parse().expect("Verbose needs to be a bool"),
                _ => panic!("Unknown Rosey option {}", row[0]),
            }
        }
        options
    }
}

impl From<&ArgMatches<'_>> for RoseyOptions {
    fn from(matches: &ArgMatches) -> Self {
        let mut result = RoseyOptions::default();
        result.source = matches.value_of("source").map(PathBuf::from);
        result.dest = matches.value_of("dest").map(PathBuf::from);
        result.version = matches.value_of("version").map(|s| s.parse().unwrap());
        result.tag = matches.value_of("tag").map(String::from);
        result.separator = matches.value_of("separator").map(String::from);
        result.locale_source = matches.value_of("locale-dest").map(PathBuf::from);
        result.locale_dest = matches.value_of("locale-source").map(PathBuf::from);
        result.default_language = matches.value_of("default-language").map(String::from);
        result
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
