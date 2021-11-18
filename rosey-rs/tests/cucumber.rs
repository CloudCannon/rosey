use cucumber::gherkin::Table;
use rosey::RoseyRunner;
use std::convert::Infallible;
use std::io::{Read, Write};
use std::process::Command;
use std::{fs, path::PathBuf};
use tempfile::tempdir;

use async_trait::async_trait;
use cucumber::{World, WorldInit};

struct RoseyOptions {
    source: String,
    dest: String,
}

impl Default for RoseyOptions {
    fn default() -> Self {
        Self {
            source: "source".to_string(),
            dest: "dest".to_string(),
        }
    }
}

impl From<&Table> for RoseyOptions {
    fn from(step_table: &Table) -> Self {
        let mut options = RoseyOptions::default();
        for row in &step_table.rows {
            match row[0].as_ref() {
                "source" => options.source = row[1].clone(),
                "dest" => options.dest = row[1].clone(),
                _ => panic!("Unknown Rosey option {}", row[1]),
            }
        }
        options
    }
}

#[derive(Debug, WorldInit)]
struct RoseyWorld {
    tmp_dir: Option<tempfile::TempDir>,
}

impl RoseyWorld {
    fn tmp_dir(&mut self) -> PathBuf {
        if self.tmp_dir.is_none() {
            self.tmp_dir = Some(tempdir().expect("testing on a system with a temp dir"));
        }
        self.tmp_dir
            .as_ref()
            .expect("just created")
            .path()
            .to_path_buf()
    }

    fn tmp_file_path(&mut self, filename: &str) -> PathBuf {
        let tmp_dir = self.tmp_dir();
        tmp_dir.join(PathBuf::from(filename))
    }

    fn write_file(&mut self, filename: &str, contents: &str) {
        let file_path = self.tmp_file_path(filename);
        fs::create_dir_all(file_path.parent().unwrap()).unwrap();

        let mut file = std::fs::File::create(&file_path).unwrap();
        file.write_all(contents.as_bytes()).unwrap();
    }

    fn read_file(&mut self, filename: &str) -> String {
        let file_path = self.tmp_file_path(filename);
        let mut file = std::fs::File::open(&file_path).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    fn check_file_exists(&mut self, filename: &str) -> bool {
        self.tmp_file_path(filename).exists()
    }

    fn run_rosey(&mut self, options: RoseyOptions) {
        match std::env::var("ROSEY_IMPL").as_deref() {
            Ok("js") => {
                let cwd = std::env::current_dir().unwrap();
                let rosey_js = cwd.join(PathBuf::from("../index.js"));
                let rosey_js = rosey_js.to_str().unwrap();
                let command = format!("{} build -s {:?} -d {:?}", rosey_js, options.source, options.dest);
                let output = Command::new("sh")
                    .arg("-c")
                    .current_dir(self.tmp_dir())
                    .arg(command)
                    .output()
                    .expect("failed to execute rosey js");
                assert!(output.stderr.is_empty());
            },
            Ok("rs") => {
                let mut runner = RoseyRunner {
                    working_directory: self.tmp_dir(),
                    source: PathBuf::from(options.source),
                    dest: PathBuf::from(options.dest),
                };
                runner.run();
            },
            Ok(other) => panic!("{} is not a valid ROSEY_IMPL. Valid impls are 'js' or 'rs'", other),
            Err(_) => panic!("\n---\nNeed an implementation to test. Please use:\nROSEY_IMPL=js cargo test\nor\nROSEY_IMPL=rs cargo test\n---\n"),
        }
    }
}

/// `cucumber::World` needs to be implemented so this World is accepted in `Steps`
#[async_trait(?Send)]
impl World for RoseyWorld {
    // We require some error type
    type Error = Infallible;

    async fn new() -> Result<Self, Infallible> {
        Ok(Self { tmp_dir: None })
    }
}

mod steps;

// This runs before everything else, so you can setup things here
#[tokio::main]
async fn main() {
    RoseyWorld::run("features").await;
}
