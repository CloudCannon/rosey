mod html;
mod json;

use std::{
    fs::{create_dir_all, File},
    io::{BufWriter, Write},
};

use globwalk::DirEntry;

use crate::{RoseyLocale, RoseyOptions};

pub struct RoseyGenerator {
    pub options: RoseyOptions,
    pub locale: RoseyLocale,
    pub current_file: String,
}

impl From<RoseyOptions> for RoseyGenerator {
    fn from(options: RoseyOptions) -> Self {
        let version = options.config.version;
        RoseyGenerator {
            options,
            locale: RoseyLocale::new(version),
            current_file: String::default(),
        }
    }
}

impl RoseyGenerator {
    pub fn run(&mut self) {
        let config = &self.options.config;
        let walker =
            globwalk::GlobWalkerBuilder::from_patterns(&config.source, &["**/*.{htm,html,json}"])
                .build()
                .unwrap()
                .into_iter()
                .filter_map(Result::ok);

        walker.for_each(|file| self.process_file(file));

        self.output_locale();
    }

    fn output_locale(&mut self) {
        let config = &self.options.config;
        let locale_dest = &config.locale_dest;
        let locale_folder = locale_dest.parent().unwrap();
        create_dir_all(locale_folder).unwrap();
        let output = self.locale.output(config.version);

        if let Ok(file) = File::create(&locale_dest) {
            let mut writer = BufWriter::new(file);
            if writer.write(output.as_bytes()).is_err() {
                eprintln!("Failed to write: {locale_dest:?}")
            }
        } else {
            eprintln!("Failed to open: {locale_dest:?}")
        }
    }

    fn process_file(&mut self, file: DirEntry) {
        match file.path().extension().map(|ext| ext.to_str().unwrap()) {
            Some("htm" | "html") => self.process_html_file(file.path()),
            Some("json") => self.process_json_file(file.path()),
            _ => unreachable!("Tried to process unknown file type."),
        }
    }
}
