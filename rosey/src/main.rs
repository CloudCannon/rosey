use clap::{App, AppSettings, Arg};
use rosey::{RoseyCommand, RoseyOptions};
use std::str::FromStr;
use std::time::Instant;

#[tokio::main]
async fn main() {
    let start = Instant::now();

    let example_defaults = rosey::options::RoseyPublicConfig::default();

    let matches = App::new("Rosey")
        .version(option_env!("RELEASE_VERSION").unwrap_or("Development"))
        .author("CloudCannon")
        .about("The CLI for the CloudCannon rosey package, an open-source tool for managing translations on static websites.")
        .setting(AppSettings::SubcommandRequiredElseHelp)
        .arg(
            Arg::with_name("verbose")
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
                        .value_name("PATH")
                        .help("The directory of your built static website (the output folder of your SSG build)\n ! Required either in a config file or via the CLI"),
                )
                .arg(
                    Arg::with_name("version")
                        .short("v")
                        .long("version")
                        .possible_values(&["1", "2"])
                        .value_name("VERSION")
                        .help(&format!(
                            "The Rosey locale version to generate and build from. \n ─ Defaults to '{}'",
                            example_defaults.version
                        )),
                )
                .arg(
                    Arg::with_name("tag")
                        .long("tag")
                        .value_name("ATTRIBUTE")
                        .help(&format!(
                            "The HTML attribute that Rosey should read from. \n ─ Defaults to '{}'",
                            example_defaults.tag
                        )),
                )
                .arg(
                    Arg::with_name("base")
                        .long("base")
                        .value_name("PATH")
                        .help(&format!(
                            "The file to generate the Rosey base locale file to. \n ─ Defaults to '{}'",
                            example_defaults.base.display()
                        )),
                )
                .arg(
                    Arg::with_name("separator")
                        .long("separator")
                        .value_name("CHAR")
                        .help(&format!(
                            "The separator to use between Rosey namespaces when generating keys. \n ─ Defaults to '{}'",
                            example_defaults.separator
                        )),
                )
                .arg(
                    Arg::with_name("config-dump")
                        .long("config-dump")
                        .help("Print all resolved configuration and exit without taking any action")
                        .takes_value(false),
                ),
        )
        .subcommand(
            App::new("build")
                .arg(
                    Arg::with_name("source")
                        .short("s")
                        .long("source")
                        .value_name("PATH")
                        .help("The directory of your built static website (the output folder of your SSG build)\n ! Required either in a config file or via the CLI"),
                )
                .arg(
                    Arg::with_name("dest")
                        .short("d")
                        .long("dest")
                        .value_name("PATH")
                        .help("The directory to output the multilingual site to. \n ─ Defaults to your source directory suffixed with _translated"),
                )
                .arg(
                    Arg::with_name("tag")
                        .long("tag")
                        .value_name("ATTRIBUTE")
                        .help(&format!(
                            "The HTML attribute that Rosey should read from. \n ─ Defaults to '{}'",
                            example_defaults.tag
                        )),
                )
                .arg(
                    Arg::with_name("locales")
                        .long("locales")
                        .value_name("PATH")
                        .help(&format!(
                            "The directory to read translated Rosey locale files from. \n ─ Defaults to '{}'",
                            example_defaults.locales.display()
                        )),
                )
                .arg(
                    Arg::with_name("default-language")
                        .long("default-language")
                        .value_name("LANG")
                        .help(&format!(
                            "The default language for the site (i.e. the language of 'base.json'). \n ─ Defaults to '{}'",
                            example_defaults.default_language
                        )),
                )
                .arg(
                    Arg::with_name("exclusions")
                        .long("exclusions")
                        .value_name("REGEX")
                        .help(&format!(
                            "A regular expression used to determine which files not to copy as assets. \n ─ Defaults to '{}'",
                            example_defaults.exclusions
                        )),
                )
                .arg(
                    Arg::with_name("separator")
                        .long("separator")
                        .value_name("CHAR")
                        .help(&format!(
                            "The separator to use between Rosey namespaces when generating keys. \n ─ Defaults to '{}'",
                            example_defaults.separator
                        )),
                )
                .arg(
                    Arg::with_name("images-source")
                        .long("images-source")
                        .value_name("PATH")
                        .takes_value(true)
                        .help("The source folder that Rosey should look for translated images within. \n ─ Defaults to the source folder"),
                )
                .arg(
                    Arg::with_name("redirect-page")
                        .long("redirect-page")
                        .value_name("PATH")
                        .takes_value(true)
                        .help("Path to a redirect template that Rosey should use instead of the default file"),
                )
                .arg(
                    Arg::with_name("wrap")
                        .long("wrap")
                        .help("For languages without significant whitespace, add spans around detected words to break lines cleanly")
                        .multiple(true)
                )
                .arg(
                    Arg::with_name("wrap-class")
                        .long("wrap-class")
                        .value_name("CLASS")
                        .takes_value(true)
                        .help("When wrapping languages, use the given classname instead of inline styles")
                )
                .arg(Arg::with_name("serve")
                        .long("serve")
                        .takes_value(false)
                        .help("Runs a local webserver on the dest folder after a successful build. Useful for local development")
                )
                .arg(
                    Arg::with_name("config-dump")
                        .long("config-dump")
                        .help("Print all resolved configuration and exit without taking any action")
                        .takes_value(false),
                ),
        )
        .subcommand(
            App::new("check")
                .arg(
                    Arg::with_name("locales")
                        .long("locales")
                        .value_name("PATH")
                        .help(&format!(
                            "The directory to read translated Rosey locale files from. \n ─ Defaults to '{}'",
                            example_defaults.locales.display()
                        )),
                )
                .arg(
                    Arg::with_name("base")
                        .long("base")
                        .value_name("PATH")
                        .help(&format!(
                            "The path to a Rosey base locale file. \n ─ Defaults to '{}'",
                            example_defaults.base.display()
                        )),
                )
                .arg(
                    Arg::with_name("version")
                        .short("v")
                        .long("version")
                        .value_name("VERSION")
                        .possible_values(&["1", "2"])
                        .help(&format!(
                            "The Rosey locale version to generate and build from. \n ─ Defaults to '{}'",
                            example_defaults.version
                        )),
                )
                .arg(
                    Arg::with_name("config-dump")
                        .long("config-dump")
                        .help("Print all resolved configuration and exit without taking any action")
                        .takes_value(false),
                ),
        )
        .get_matches();

    let (subcommand, matches) = matches.subcommand();
    let matches = matches.unwrap_or_else(|| {
        eprintln!("Failed to match any subcommand arguments");
        std::process::exit(1);
    });

    let options = RoseyOptions::load_with_flags(matches);
    options
        .run(RoseyCommand::from_str(subcommand).unwrap_or_else(|e| {
            eprintln!("Error running Rosey: {e}");
            std::process::exit(1);
        }))
        .await;

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
