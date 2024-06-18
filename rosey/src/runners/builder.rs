mod html;
mod json;
mod redirect_page;
mod serve;

use std::{
    collections::BTreeMap,
    fs::{copy, create_dir_all, read_to_string, remove_dir_all, File},
    io::{BufWriter, Write},
    path::Path,
};

use notify::{
    event::{CreateKind, ModifyKind},
    Event, EventKind, RecursiveMode, Watcher,
};
use rayon::prelude::*;
use regex::Regex;

use crate::{RoseyOptions, RoseyTranslation};

pub struct RoseyBuilder {
    options: RoseyOptions,
    pub translations: BTreeMap<String, RoseyTranslation>,
    pub url_translations: BTreeMap<String, RoseyTranslation>,
}

impl From<RoseyOptions> for RoseyBuilder {
    fn from(options: RoseyOptions) -> Self {
        RoseyBuilder {
            options,
            translations: BTreeMap::default(),
            url_translations: BTreeMap::default(),
        }
    }
}

impl RoseyBuilder {
    pub async fn run(mut self) {
        self.clean_output_dir();
        self.read_translations();
        self.process_assets();
        self.process_files();

        if self.options.serve {
            self.serve().await;
        }
    }

    async fn serve(self) {
        let config = &self.options.config;
        let source_dir = config.source.clone();
        let dest_dir = config.dest.clone();
        let re = Regex::new(&config.exclusions).expect("Invalid regex");
        let mut watcher = notify::recommended_watcher(move |res| match res {
            Ok(Event {
                kind:
                    EventKind::Modify(ModifyKind::Data(_) | ModifyKind::Name(_))
                    | EventKind::Create(CreateKind::File),
                paths,
                ..
            }) => {
                println!("Rebuilding...");
                paths.iter().for_each(|path| {
                    if !re.is_match(&path.to_string_lossy()) {
                        return self.process_asset(path);
                    }

                    if self.find_locale_overwrite(path).is_some() {
                        return self.process_file(path);
                    }

                    self.process_file(path);
                    self.process_file_overrides(path);
                });
                println!("Done!");
            }
            Err(e) => println!("watch error: {:?}", e),
            _ => (),
        })
        .unwrap();

        watcher
            .watch(&source_dir, RecursiveMode::Recursive)
            .unwrap();

        serve::serve_dir(dest_dir.clone()).await;
    }

    pub fn clean_output_dir(&self) {
        let dest_folder = &self.options.config.dest;
        if dest_folder.exists() {
            remove_dir_all(dest_folder).expect("Failed to clean destination folder");
        }
    }

    pub fn process_assets(&self) {
        let config = &self.options.config;
        let re = Regex::new(&config.exclusions).expect("Invalid regex");
        let walker = globwalk::GlobWalkerBuilder::from_patterns(&config.source, &["**/*"])
            .build()
            .unwrap()
            .into_iter()
            .filter_map(Result::ok)
            .filter(|file| {
                file.file_type().is_file() && !re.is_match(&file.path().to_string_lossy())
            });

        walker
            .collect::<Vec<_>>()
            .par_iter()
            .for_each(|file| self.process_asset(file.path()));
    }

    pub fn process_asset(&self, path: &Path) {
        let config = &self.options.config;
        let relative_path = path.strip_prefix(&config.source).unwrap();
        let dest_file = &config.dest.join(relative_path);

        if let Some(parent) = dest_file.parent() {
            create_dir_all(parent).unwrap();
        }

        if path != dest_file {
            copy(path, dest_file).unwrap();
        }
    }

    pub fn process_files(&self) {
        let config = &self.options.config;
        let source_folder = &config.source;
        let walker: (Vec<_>, Vec<_>) =
            globwalk::GlobWalkerBuilder::from_patterns(source_folder, &["**/*.{html,json}"])
                .build()
                .unwrap()
                .into_iter()
                .filter_map(Result::ok)
                .partition(|file| self.find_locale_overwrite(file.path()).is_none());

        walker
            .0
            .par_iter()
            .for_each(|file| self.process_file(file.path()));

        walker
            .1
            .par_iter()
            .for_each(|file| self.process_file(file.path()));
    }

    fn find_locale_overwrite(&self, path: &Path) -> Option<&String> {
        let config = &self.options.config;
        let source_folder = &config.source;
        let relative_path = path.strip_prefix(source_folder).unwrap();
        self.translations.keys().find(|key| {
            relative_path
                .parent()
                .map(|parent| parent.starts_with(key))
                .unwrap_or(false)
        })
    }

    pub fn read_translations(&mut self) {
        let config = &self.options.config;
        let walker = globwalk::GlobWalkerBuilder::from_patterns(&config.locales, &["**/*.json"])
            .build()
            .unwrap()
            .into_iter()
            .filter_map(Result::ok);

        walker.for_each(|file| {
            let locale = file
                .path()
                .file_stem()
                .unwrap()
                .to_string_lossy()
                .to_string();
            let value = read_to_string(file.path()).expect("Failed to read locale file");
            let value = serde_json::from_str(&value);
            if let Ok(value) = value {
                if locale.ends_with(".urls") {
                    self.url_translations
                        .insert(locale.trim_end_matches(".urls").to_string(), value);
                } else {
                    self.translations.insert(locale, value);
                }
            }
        });
    }

    pub fn process_file(&self, file: &Path) {
        match file.extension().map(|ext| ext.to_str().unwrap()) {
            Some("htm" | "html") => self.process_html_file(file),
            Some("json") => self.process_json_file(file),
            _ => unreachable!("Tried to process unknown file type."),
        }
    }

    pub fn process_file_overrides(&self, path: &Path) {
        let config = &self.options.config;
        let source_folder = &config.source;
        let relative_path = path.strip_prefix(source_folder).unwrap();
        self.translations
            .par_iter()
            .filter(|(locale, _)| source_folder.join(locale).join(relative_path).exists())
            .for_each(|(locale, _)| {
                self.process_file(&source_folder.join(locale).join(relative_path))
            });
    }

    pub fn output_file(&self, locale: &str, relative_path: &Path, content: String) {
        let config = &self.options.config;
        let dest_folder = &config.dest.join(locale);
        let dest_path = dest_folder.join(relative_path);
        if let Some(parent) = dest_path.parent() {
            create_dir_all(parent).unwrap();
        }

        if let Ok(file) = File::create(&dest_path) {
            let mut writer = BufWriter::new(file);
            if writer.write(content.as_bytes()).is_err() {
                eprintln!("Failed to write: {dest_path:?}")
            }
        } else {
            eprintln!("Failed to open: {dest_path:?}")
        }
    }
}
