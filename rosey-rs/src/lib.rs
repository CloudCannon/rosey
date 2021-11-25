mod runners;

use crate::runners::generator::RoseyGenerator;
use std::path::PathBuf;

pub enum RoseyCommand {
    Generate,
    Build,
}

// This could do with less Option<>s
pub struct RoseyRunner {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub dest: PathBuf,
    pub command: RoseyCommand,
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
        command: RoseyCommand,
        version: Option<u8>,
        tag: Option<String>,
        separator: Option<String>,
        locale_dest: Option<PathBuf>,
    ) -> RoseyRunner {
        RoseyRunner {
            working_directory,
            source: PathBuf::from(source.unwrap_or(String::from("."))),
            dest: PathBuf::from(dest.unwrap()),
            command: RoseyCommand::Generate,
            version: 2,
            tag: "data-rosey".to_string(),
            separator: ":".to_string(),
            locale_dest: PathBuf::from("rosey/source.json"),
        }
    }

    pub fn run(self) {
        match self.command {
            RoseyCommand::Generate => RoseyGenerator::from(self).run(),
            _ => todo!(),
        }
    }
}
