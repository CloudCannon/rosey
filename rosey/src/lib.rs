pub mod options;
mod runners;

use crate::runners::generator::RoseyGenerator;
use anyhow::{bail, Error};
use clap::ArgMatches;
pub use options::*;
use runners::{builder::RoseyBuilder, checker::RoseyChecker};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, env, path::PathBuf, str::FromStr};

const SUPPORTED_WRAP_LANGS: [&str; 4] = ["ja", "he", "th", "zh"];

pub enum RoseyCommand {
    Generate,
    Build,
    Check,
}

impl FromStr for RoseyCommand {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "generate" => Ok(RoseyCommand::Generate),
            "build" => Ok(RoseyCommand::Build),
            "check" => Ok(RoseyCommand::Check),
            other => bail!("Unsupported subcommand: {other}"),
        }
    }
}

trait GetGeneric {
    fn get<'a, T>(&'a self, flag: &str, fallback: T) -> T
    where
        T: std::convert::From<&'a str>;
    fn get_opt<'a, T>(&'a self, flag: &str, fallback: Option<T>) -> Option<T>
    where
        T: std::convert::From<&'a str>;
}
impl GetGeneric for ArgMatches<'_> {
    fn get<'a, T>(&'a self, flag: &str, fallback: T) -> T
    where
        T: std::convert::From<&'a str>,
    {
        self.value_of(flag).map(Into::into).unwrap_or(fallback)
    }
    fn get_opt<'a, T>(&'a self, flag: &str, fallback: Option<T>) -> Option<T>
    where
        T: std::convert::From<&'a str>,
    {
        self.value_of(flag).map(Into::into).or(fallback)
    }
}

pub struct RoseyOptions {
    pub working_directory: PathBuf,
    pub serve: bool,
    pub config: RoseyPublicConfig,
}

impl RoseyOptions {
    pub fn load_with_flags(matches: &ArgMatches, subcommand: &RoseyCommand) -> RoseyOptions {
        let base = match options::load_config_files() {
            Ok(config) => config,
            Err(e) => {
                eprintln!("Failed to load Rosey configuration: {e}");
                std::process::exit(1);
            }
        };

        let original_source = matches.get("source", base.source.clone());
        let dest = matches.get("dest", base.dest);
        let working_dir = env::current_dir().unwrap_or_else(|e| {
            eprintln!("Couldn't access the current working directory: {e}");
            std::process::exit(1);
        });

        if !matches!(subcommand, RoseyCommand::Check)
            && original_source.to_string_lossy().is_empty()
        {
            eprintln!(
                "Rosey requires a source directory to process. Provide either: \n\
                       • A `--source <PATH>` CLI flag \n\
                       • A `source` key in a rosey.yml, rosey.toml, or rosey.json file \n\
                       • A `ROSEY_SOURCE` environment variable"
            );
            std::process::exit(1);
        }

        let options = RoseyOptions {
            working_directory: working_dir.clone(),
            serve: matches.is_present("serve"),
            config: RoseyPublicConfig {
                source: working_dir.join(matches.get("source", base.source)),
                dest: working_dir.join(match dest.to_string_lossy().len() {
                    0 => {
                        let source = original_source.to_string_lossy();
                        let source = source.trim_end_matches(['/', '\\']);
                        PathBuf::from(&format!("{source}_translated"))
                    }
                    _ => dest,
                }),
                version: match matches.value_of("version").map(|s| s.parse()) {
                    Some(Ok(v)) => v,
                    _ => base.version,
                },
                tag: matches.get("tag", base.tag),
                separator: matches.get("separator", base.separator),
                locales: working_dir.join(matches.get("locales", base.locales)),
                base: working_dir.join(matches.get("base", base.base)),
                base_urls: working_dir.join(matches.get("base-urls", base.base_urls)),
                default_language: matches.get("default-language", base.default_language),
                default_language_at_root: matches.is_present("default-language-at-root") || base.default_language_at_root,
                redirect_page: matches
                    .get_opt("redirect-page", base.redirect_page)
                    .map(|p| working_dir.join(p)),
                exclusions: matches.get("exclusions", base.exclusions),
                images_source: matches
                    .get_opt("images-source", base.images_source)
                    .map(|p| working_dir.join(p)),
                wrap: match matches.values_of("wrap") {
                    Some(langs) => Some(langs.map(|l|{

                        if !SUPPORTED_WRAP_LANGS.iter().any(|lang| l.starts_with(lang)) {
                            eprintln!("Cannot wrap text for language '{l}'. Languages with supported text wrapping: {SUPPORTED_WRAP_LANGS:?}");
                            std::process::exit(1);
                        }
                        l.to_owned()
                    }).collect()),
                    _ => base.wrap,
                },
                wrap_class: matches.get_opt("wrap-class", base.wrap_class),
                verbose: matches.is_present("verbose") || base.verbose,
                languages: None, // TODO
            },
        };

        if matches.is_present("config-dump") {
            println!("{}", options.config);
            std::process::exit(0);
        }

        options
    }

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

    pub fn insert_uncounted(&mut self, key: String, value: String) {
        match self {
            RoseyTranslation::V1(keys) => {
                keys.insert(key, value);
            }
            RoseyTranslation::V2(keys) => {
                keys.insert(key, RoseyTranslationEntry::new(value));
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

    pub fn insert_uncounted(&mut self, key: String, value: String) {
        self.keys.insert_uncounted(key, value);
    }

    pub fn output(&mut self, version: u8) -> String {
        match version {
            2 => serde_json::to_string_pretty(self).unwrap(),
            1 => serde_json::to_string_pretty(&self.keys).unwrap(),
            _ => unreachable!(),
        }
    }
}

pub fn inline_templates(dom: &kuchiki::NodeRef) {
    dom.inclusive_descendants().for_each(|node| {
        if let Some(kuchiki::ElementData {
            template_contents: Some(contents),
            ..
        }) = node.as_element()
        {
            inline_templates(contents);
            node.append(contents.clone());
        }
    })
}
