use clap::{App, AppSettings, Arg};
use rosey::{RoseyCommand, RoseyOptions};
use std::str::FromStr;
use std::time::Instant;

fn main() {
    let start = Instant::now();

    // TODO: Implement the rest of the flags
    let matches = App::new("Rosey")
        .version("1.0")
        .author("CloudCannon")
        .about("intl")
        .setting(AppSettings::SubcommandRequiredElseHelp)
        .subcommand(
            App::new("generate")
                .arg(
                    Arg::with_name("source")
                        .short("s")
                        .long("source")
                        .default_value("."),
                )
                .arg(
                    Arg::with_name("version")
                        .short("v")
                        .long("version")
                        .possible_values(&["1", "2"])
                        .default_value("2"),
                )
                .arg(
                    Arg::with_name("tag")
                        .short("t")
                        .long("tag")
                        .default_value("data-rosey"),
                )
                .arg(
                    Arg::with_name("locale-dest")
                        .short("d")
                        .long("locale-dest")
                        .default_value("rosey/source.json"),
                )
                .arg(
                    Arg::with_name("separator")
                        .short("e")
                        .long("separator")
                        .default_value(":"),
                ),
        )
        .subcommand(
            App::new("build")
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
                .arg(
                    Arg::with_name("tag")
                        .short("t")
                        .long("tag")
                        .default_value("data-rosey"),
                )
                .arg(
                    Arg::with_name("locale-source")
                        .short("l")
                        .long("locale-source")
                        .default_value("rosey/locales/"),
                )
                .arg(
                    Arg::with_name("default-language")
                        .short("a")
                        .long("default-language")
                        .default_value("en"),
                ),
        )
        .subcommand(App::new("check"))
        .subcommand(App::new("convert"))
        .subcommand(App::new("watch"))
        .subcommand(App::new("clean"))
        .subcommand(App::new("base"))
        .subcommand(App::new("translate"))
        .get_matches();

    let (subcommand, matches) = matches.subcommand();
    let matches = matches.unwrap();

    let options = RoseyOptions::from(matches);
    options.run(RoseyCommand::from_str(subcommand).unwrap());

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
