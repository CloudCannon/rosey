use clap::{App, Arg};
use rosey::{RoseyCommand, RoseyRunner};
use std::env;
use std::path::PathBuf;
use std::time::Instant;

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

    let runner = RoseyRunner::new(
        env::current_dir().unwrap(),
        matches.value_of("source").map(String::from),
        matches.value_of("dest").map(String::from),
        Some(2),
        Some("data-rosey".to_string()),
        Some(":".to_string()),
        Some(PathBuf::from("rosey/source.json")),
        Some(PathBuf::from("rosey/locale/")),
    );

    runner.run(RoseyCommand::Build);

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
