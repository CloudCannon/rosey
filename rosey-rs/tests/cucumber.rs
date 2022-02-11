use cucumber::gherkin::Table;
use rosey::{RoseyCommand, RoseyOptions};
use std::convert::Infallible;
use std::io::{Read, Write};
use std::process::Command;
use std::str::{from_utf8, FromStr};
use std::{fs, path::PathBuf};
use tempfile::tempdir;
use wax::Glob;

use async_trait::async_trait;
use cucumber::{World, WorldInit};

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

    fn get_file_tree(&mut self) -> String {
        let glob = Glob::new("**/*").unwrap();
        let base_dir = self.tmp_file_path(".");
        let entries: Vec<String> = glob
            .walk(&base_dir, usize::MAX)
            .flatten()
            .map(|entry| {
                let file = entry.path().strip_prefix(&base_dir).unwrap();
                let indentation = "  ".repeat(file.components().count() - 1);
                format!(
                    "| {}{}",
                    indentation,
                    file.file_name().unwrap().to_str().unwrap()
                )
            })
            .collect();
        entries.join("\n")
    }

    fn assert_file_exists(&mut self, filename: &str) {
        if !self.check_file_exists(filename) {
            panic!(
                "\"{}\" does not exist in the tree:\n-----\n{}\n-----\n",
                filename,
                self.get_file_tree()
            );
        }
    }

    fn assert_file_doesnt_exist(&mut self, filename: &str) {
        if self.check_file_exists(filename) {
            panic!(
                "\"{}\" should not exist but does in the tree:\n-----\n{}\n-----\n",
                filename,
                self.get_file_tree()
            );
        }
    }

    fn check_file_exists(&mut self, filename: &str) -> bool {
        self.tmp_file_path(filename).exists()
    }

    fn run_rosey(&mut self, command: String, options: RoseyOptions) {
        match std::env::var("ROSEY_IMPL").as_deref() {
            Ok("js") => {
                let js_cli = build_js_rosey_command(&command, options);
                let output = Command::new("sh")
                    .arg("-c")
                    .current_dir(self.tmp_dir())
                    .arg(&js_cli)
                    .output()
                    .expect("failed to execute rosey js");
                if !output.stderr.is_empty() {
                    panic!("Ran \"{}\" and stderr was not empty. Was:\n{}", &js_cli, from_utf8(&output.stderr).unwrap_or("failed utf8"));
                }
            },
            Ok("rs") => {
                let command = RoseyCommand::from_str(&command).unwrap();
                
                let options = RoseyOptions{
                    working_directory: self.tmp_dir(),
                    ..options
                };
                options.run(command);
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

struct RoseyJsCommand(String);

impl RoseyJsCommand {
    fn add<F: Fn(String) -> String>(&mut self, field: String, formatter: F) {
        self.0 = format!("{} {}", self.0, formatter(field));
    }

    fn try_add<F: Fn(String) -> String>(&mut self, field: Option<String>, formatter: F) {
        if let Some(field) = field {
            self.add(field, formatter);
        }
    }

    fn add_flag(&mut self, field: bool, flag: String) {
        if field {
            self.0 = format!("{} {}", self.0, flag);
        }
    }

    fn consume(self) -> String {
        self.0
    }
}

// Some helpers
fn build_rosey_options(step_table: &Table) -> RoseyOptions {
    let mut options = RoseyOptions::default();
    for row in &step_table.rows {
        match row[0].as_ref() {
            "source" => options.source = Some(PathBuf::from(row[1].clone())),
            "dest" => options.dest = Some(PathBuf::from(row[1].clone())),
            "version" => {
                options.version = Some(row[1].parse().expect("Version needs to be an integer"))
            }
            "tag" => options.tag = Some(row[1].clone()),
            "separator" => options.separator = Some(row[1].clone()),
            "locale-dest" => options.locale_dest = Some(PathBuf::from(row[1].clone())),
            "locale-source" => options.locale_source = Some(PathBuf::from(row[1].clone())),
            "languages" => {
                options.languages =
                    Some(row[1].clone().split(',').map(|s| s.to_string()).collect())
            }
            "credentials" => options.credentials = Some(row[1].clone()),
            "exclusions" => options.exclusions = Some(row[1].clone()),
            "images-source" => options.images_source = Some(PathBuf::from(row[1].clone())),
            "default-language" => options.default_language = Some(row[1].clone()),
            "source-delimiter" => options.source_delimiter = Some(row[1].clone()),
            "redirect-page" => options.redirect_page = Some(PathBuf::from(row[1].clone())),
            "verbose" => options.verbose = row[1].parse().expect("Verbose needs to be a bool"),
            _ => panic!("Unknown Rosey option {}", row[0]),
        }
    }
    options
}

fn build_js_rosey_command(command: &str, options: RoseyOptions) -> String {
    let cwd = std::env::current_dir().unwrap();
    let rosey_path = cwd.join(PathBuf::from("../index.js"));
    let rosey_path = rosey_path.to_str().unwrap();

    let mut command = RoseyJsCommand(format!("{} {}", rosey_path, command));
    command.try_add(
        options.source.map(|p| p.to_str().unwrap().to_string()),
        |s| format!("-s {}", s),
    );
    command.try_add(options.dest.map(|p| p.to_str().unwrap().to_string()), |s| {
        format!("-d {}", s)
    });
    command.try_add(options.version.map(|v| v.to_string()), |s| {
        format!("-v {}", s)
    });
    command.try_add(options.tag, |s| format!("-t \"{}\"", s));
    command.try_add(options.separator, |s| format!("--separator \"{}\"", s));
    command.try_add(
        options.locale_dest.map(|p| p.to_str().unwrap().to_string()),
        |s| format!("--locale-dest {}", s),
    );

    command.try_add(
        options
            .locale_source
            .map(|p| p.to_str().unwrap().to_string()),
        |s| format!("--locale_source {}", s),
    );
    command.try_add(options.credentials, |s| format!("--credentials \"{}\"", s));
    command.try_add(options.exclusions, |s| format!("--exclusions \"{}\"", s));
    command.try_add(options.images_source.map(|p| p.to_str().unwrap().to_string()), |s| format!("--images_source {}", s));
    command.try_add(options.default_language, |s| {
        format!("--default_language \"{}\"", s)
    });
    command.try_add(options.source_delimiter, |s| {
        format!("--source_delimiter \"{}\"", s)
    });
    command.try_add(options.redirect_page.map(|p| p.to_str().unwrap().to_string()), |s| format!("--redirect_page {}", s));

    command.add_flag(options.verbose, "--verbose".to_string());

    if let Some(languages) = options.languages {
        command.add(languages.join(","), |s| format!("--languages \"{}\"", s));
    }

    command.consume()
}
