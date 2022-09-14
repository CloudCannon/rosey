use clap::{App, AppSettings, Arg};
use rosey::{RoseyCommand, RoseyOptions};
use std::str::FromStr;
use std::time::Instant;

#[tokio::main]
async fn main() {
    let start = Instant::now();

    let matches = App::new("Rosey")
        .version(option_env!("RELEASE_VERSION").unwrap_or("Development"))
        .author("CloudCannon")
        .about("The CLI for the CloudCannon rosey package, an open-source tool for managing translations on static websites.")
        .setting(AppSettings::SubcommandRequiredElseHelp)
        .arg(
            Arg::with_name("verbose")
                .short("v")
                .long("verbose")
                .help("Print verbose logs while running the Rosey CLI. Does not affect the output website")
                .takes_value(false),
        )
        .subcommand(
            App::new("generate")
                .arg(
                    Arg::with_name("source")
                        .short("s")
                        .long("source")
                        .default_value("dist/site"),
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
                        .default_value("dist/site"),
                )
                .arg(
                    Arg::with_name("dest")
                        .short("d")
                        .long("dest")
                        .value_name("PATH")
                        .help("Sets the output directory")
                        .default_value("dist/translated_site"),
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
                )
                .arg(
                    Arg::with_name("exclusions")
                        .long("exclusions")
                        .default_value(r#"\.(html?|json)$"#),
                )
                .arg(
                    Arg::with_name("separator")
                        .short("e")
                        .long("separator")
                        .default_value(":"),
                )
                .arg(
                    Arg::with_name("images-source")
                        .long("images-source")
                        .takes_value(true),
                )
                .arg(
                    Arg::with_name("redirect-page")
                        .long("redirect-page")
                        .takes_value(true),
                )
                .arg(Arg::with_name("serve").long("serve").takes_value(false)),
        )
        .subcommand(
            App::new("check")
                .arg(
                    Arg::with_name("locale-source")
                        .short("l")
                        .long("locale-source")
                        .default_value("rosey/locales/"),
                )
                .arg(
                    Arg::with_name("locale-dest")
                        .short("d")
                        .long("locale-dest")
                        .default_value("rosey/source.json"),
                )
                .arg(
                    Arg::with_name("version")
                        .short("v")
                        .long("version")
                        .possible_values(&["1", "2"])
                        .default_value("2"),
                ),
        )
        .get_matches();

    let (subcommand, matches) = matches.subcommand();
    let matches = matches.unwrap();

    let options = RoseyOptions::from(matches);
    options
        .run(RoseyCommand::from_str(subcommand).unwrap())
        .await;

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
