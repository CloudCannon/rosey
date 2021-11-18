use std::path::PathBuf;

pub struct RoseyRunner {
    pub working_directory: PathBuf,
    pub source: PathBuf,
    pub dest: PathBuf,
    pub command: String,
}

impl RoseyRunner {
    pub fn run(&mut self) {
        todo!()
    }
}
