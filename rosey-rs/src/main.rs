use clap::{App, Arg};
use rosey::RoseyRunner;
use std::time::Instant;
use std::{env, path::PathBuf};

fn main() {
    let start = Instant::now();

    // TODO: Implement the rest of the flags
    let matches = App::new("Rosey")
        .version("1.0")
        .author("CloudCannon")
        .about("intl")
        .arg(
            Arg::with_name("source")
                .short("s")
                .long("source")
                .value_name("PATH")
                .help("Sets the source directory of the website to parse")
                .takes_value(true),
        )
        .arg(
            Arg::with_name("dest")
                .short("d")
                .long("dest")
                .value_name("PATH")
                .help("Sets the output directory")
                .required(true)
                .takes_value(true),
        )
        .get_matches();

    // I think these are the current defaults
    let mut runner = RoseyRunner {
        working_directory: env::current_dir().unwrap(),
        source: Some(PathBuf::from(matches.value_of("source").unwrap_or("."))),
        dest: Some(PathBuf::from(matches.value_of("dest").unwrap())),
        command: "build".to_string(),
        version: Some(2),
        tag: Some("data-rosey".to_string()),
        separator: Some(":".to_string()),
        locale_dest: Some(PathBuf::from("rosey/source.json")),
    };

    runner.run();

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
