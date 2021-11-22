use std::path::PathBuf;

// This could do with less Option<>s
pub struct RoseyRunner {
    pub working_directory: PathBuf,
    pub source: Option<PathBuf>,
    pub dest: Option<PathBuf>,
    pub command: String, // Should be an enum
    pub version: Option<u8>,
    pub tag: Option<String>,
    pub separator: Option<String>,
    pub locale_dest: Option<PathBuf>,
}

impl RoseyRunner {
    pub fn run(&mut self) {
        todo!()
    }
}
