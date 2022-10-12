use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashMap},
    fs::{create_dir_all, read_to_string, File},
    io::{BufWriter, Write},
    str::FromStr,
};

use globwalk::DirEntry;

use crate::{RoseyLocale, RoseyOptions, RoseyTranslation};

#[derive(Serialize, Deserialize, Hash, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum RoseyCheckStates {
    Current,
    Outdated,
    Missing,
    Unused,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RoseyCheck {
    current: bool,
    base_total: i32,
    total: i32,
    states: HashMap<RoseyCheckStates, i32>,
    keys: HashMap<String, RoseyCheckStates>,
}

pub struct RoseyChecker {
    options: RoseyOptions,
    check: BTreeMap<String, RoseyCheck>,
    base_locale: RoseyLocale,
}

impl From<RoseyOptions> for RoseyChecker {
    fn from(options: RoseyOptions) -> Self {
        RoseyChecker {
            options,
            check: BTreeMap::default(),
            base_locale: RoseyLocale::default(),
        }
    }
}

impl RoseyChecker {
    pub fn run(&mut self) {
        let config = &self.options.config;
        let locale_dest = config.base.clone();
        let value = read_to_string(&locale_dest).expect("Failed to read locale file");
        let value = RoseyLocale::from_str(&value);
        if let Ok(locale) = value {
            self.base_locale = locale;
        }

        let walker = globwalk::GlobWalkerBuilder::from_patterns(&config.locales, &["**/*.json"])
            .build()
            .unwrap()
            .into_iter()
            .filter_map(Result::ok);

        walker.for_each(|entry| self.process_file(entry));

        let locale_folder = locale_dest.parent().unwrap();
        let check_dest = locale_folder.join("checks.json");
        create_dir_all(locale_folder).unwrap();
        let output = serde_json::to_string_pretty(&self.check).unwrap();

        if let Ok(file) = File::create(&check_dest) {
            let mut writer = BufWriter::new(file);
            if writer.write(output.as_bytes()).is_err() {
                eprintln!("Failed to write: {check_dest:?}")
            }
        } else {
            eprintln!("Failed to open: {check_dest:?}")
        }
    }

    fn process_file(&mut self, file: DirEntry) {
        let locale = file
            .path()
            .file_stem()
            .unwrap()
            .to_string_lossy()
            .to_string();
        let value = read_to_string(file.path()).expect("Failed to read locale file");
        let value = serde_json::from_str::<RoseyTranslation>(&value);
        if let Ok(mut translation) = value {
            let check = self.check_translation(&mut translation);
            self.check.insert(locale, check);
        }
    }

    fn check_translation(&mut self, target_keys: &mut RoseyTranslation) -> RoseyCheck {
        let mut check = RoseyCheck {
            current: true,
            base_total: self.base_locale.keys.len() as i32,
            total: target_keys.len() as i32,
            ..Default::default()
        };

        check.states.insert(RoseyCheckStates::Outdated, 0);
        check.states.insert(RoseyCheckStates::Current, 0);
        check.states.insert(RoseyCheckStates::Missing, 0);
        check.states.insert(RoseyCheckStates::Unused, 0);

        let mut target_keys = target_keys.normalize();

        self.base_locale
            .keys
            .normalize()
            .iter()
            .for_each(|(key, translation)| {
                if let Some(target_key) = target_keys.get(key) {
                    if translation.original != target_key.original {
                        check.current = false;
                        let outdated = check.states.entry(RoseyCheckStates::Outdated).or_insert(0);
                        *outdated += 1;
                        check
                            .keys
                            .insert(key.to_string(), RoseyCheckStates::Outdated);
                    } else {
                        let current = check.states.entry(RoseyCheckStates::Current).or_insert(0);
                        *current += 1;
                        check
                            .keys
                            .insert(key.to_string(), RoseyCheckStates::Current);
                    }
                } else {
                    check.current = false;
                    let missing = check.states.entry(RoseyCheckStates::Missing).or_insert(0);
                    *missing += 1;
                    check
                        .keys
                        .insert(key.to_string(), RoseyCheckStates::Missing);
                }
                target_keys.remove(key);
            });

        target_keys.iter().for_each(|(key, _translation)| {
            check.current = false;
            let unused = check.states.entry(RoseyCheckStates::Unused).or_insert(0);
            *unused += 1;
            check.keys.insert(key.to_string(), RoseyCheckStates::Unused);
        });

        check
    }
}
