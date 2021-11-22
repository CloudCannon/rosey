use std::path::PathBuf;

pub struct RoseyRunner {
    pub working_directory: PathBuf,
    pub source: Option<PathBuf>,
    pub dest: Option<PathBuf>,
    pub command: String,
    pub version: Option<u8>,
}

impl RoseyRunner {
    pub fn run(&mut self) {
        todo!()
    }
}
