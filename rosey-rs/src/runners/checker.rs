use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashMap},
    fs::{create_dir_all, read_to_string, File},
    io::{BufWriter, Write},
    path::PathBuf,
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
    source_total: i32,
    total: i32,
    states: HashMap<RoseyCheckStates, i32>,
    keys: HashMap<String, RoseyCheckStates>,
}

pub struct RoseyChecker {
    pub working_directory: PathBuf,
    pub locale_dest: PathBuf,
    pub locale_source: PathBuf,
    check: BTreeMap<String, RoseyCheck>,
    base_locale: RoseyLocale,
}

impl From<RoseyOptions> for RoseyChecker {
    fn from(runner: RoseyOptions) -> Self {
        RoseyChecker {
            working_directory: runner.working_directory,
            locale_dest: runner.locale_dest.unwrap(),
            locale_source: runner.locale_source.unwrap(),
            check: BTreeMap::default(),
            base_locale: RoseyLocale::default(),
        }
    }
}

impl RoseyChecker {
    pub fn run(&mut self) {
        let locale_dest = self.working_directory.join(&self.locale_dest);
        let value = read_to_string(&locale_dest).expect("Failed to read locale file");
        let value = RoseyLocale::from_str(&value);
        if let Ok(locale) = value {
            self.base_locale = locale;
        }

        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.locale_source),
            &["**/*.json"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok);

        walker.for_each(|entry| self.process_file(entry));

        let locale_folder = locale_dest.parent().unwrap();
        let check_dest = locale_folder.join("checks.json");
        create_dir_all(locale_folder).unwrap();
        let output = serde_json::to_string(&self.check).unwrap();

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
        let value = serde_json::from_str::<BTreeMap<String, RoseyTranslation>>(&value);
        if let Ok(mut value) = value {
            let locale_check = self.check_locale(&mut value);
            self.check.insert(locale, locale_check);
        }
    }

    fn check_locale(&mut self, target_keys: &mut BTreeMap<String, RoseyTranslation>) -> RoseyCheck {
        let mut check = RoseyCheck {
            current: true,
            source_total: self.base_locale.keys.len() as i32,
            total: target_keys.len() as i32,
            ..Default::default()
        };

        check.states.insert(RoseyCheckStates::Outdated, 0);
        check.states.insert(RoseyCheckStates::Current, 0);
        check.states.insert(RoseyCheckStates::Missing, 0);
        check.states.insert(RoseyCheckStates::Unused, 0);

        self.base_locale.keys.iter().for_each(|(key, translation)| {
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
