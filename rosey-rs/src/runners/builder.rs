mod html;
mod json;
mod redirect_page;

use std::{
    collections::HashMap,
    fs::{copy, create_dir_all, read_to_string, File},
    io::{BufWriter, Write},
    path::{Path, PathBuf},
    str::FromStr,
};

use globwalk::DirEntry;
use rayon::prelude::*;
use regex::Regex;

use crate::{RoseyLocale, RoseyOptions};

pub struct RoseyBuilder {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub locale_source: PathBuf,
    pub dest: PathBuf,
    pub tag: String,
    pub separator: String,
    pub default_language: String,
    pub locales: HashMap<String, RoseyLocale>,
    pub redirect_page: Option<PathBuf>,
    pub exclusions: String,
    pub images_source: Option<PathBuf>,
}

impl From<RoseyOptions> for RoseyBuilder {
    fn from(runner: RoseyOptions) -> Self {
        RoseyBuilder {
            working_directory: runner.working_directory,
            source: runner.source.unwrap(),
            locale_source: runner.locale_source.unwrap(),
            dest: runner.dest.unwrap(),
            tag: runner.tag.unwrap(),
            default_language: runner.default_language.unwrap(),
            locales: HashMap::default(),
            separator: runner.separator.unwrap(),
            redirect_page: runner.redirect_page,
            exclusions: runner.exclusions.unwrap(),
            images_source: runner.images_source,
        }
    }
}

impl RoseyBuilder {
    pub fn run(&mut self) {
        self.read_locales();
        self.process_assets();
        self.process_files();
    }

    pub fn process_assets(&mut self) {
        let re = Regex::new(&self.exclusions).expect("Invalid regex");
        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.source),
            &["*"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok)
        .filter(|file| {
            file.file_type().is_file() && !re.is_match(&file.path().display().to_string())
        });

        walker.collect::<Vec<_>>().par_iter().for_each(|file| {
            let source_folder = self.working_directory.join(&self.source);
            let dest_folder = self.working_directory.join(&self.dest);
            let relative_path = file.path().strip_prefix(&source_folder).unwrap();
            let dest_file = dest_folder.join(relative_path);

            if let Some(parent) = dest_file.parent() {
                create_dir_all(parent).unwrap();
            }

            if file.path() != dest_file {
                copy(file.path(), dest_file).unwrap();
            }
        });
    }

    pub fn process_files(&mut self) {
        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.source),
            &["*{.html,.json}"],
        )
        .build()
        .unwrap()
        .into_iter()
        .filter_map(Result::ok);

        walker
            .collect::<Vec<_>>()
            .par_iter()
            .for_each(|file| self.process_file(file));
    }

    pub fn read_locales(&mut self) {
        let walker = globwalk::GlobWalkerBuilder::from_patterns(
            self.working_directory.join(&self.locale_source),
            &["*.json"],
        )
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
            let value = RoseyLocale::from_str(&value);
            if let Ok(value) = value {
                self.locales.insert(locale, value);
            }
        });
    }

    pub fn process_file(&self, file: &DirEntry) {
        match file.path().extension().map(|ext| ext.to_str().unwrap()) {
            Some("htm" | "html") => self.process_html_file(file.path()),
            Some("json") => self.process_json_file(file.path()),
            _ => unreachable!("Tried to process unknown file type."),
        }
    }

    pub fn output_file(&self, locale: &str, relative_path: &Path, content: String) {
        let dest_folder = self.working_directory.join(&self.dest).join(locale);
        let dest_path = dest_folder.join(&relative_path);
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
