use clap::{Arg, ArgAction, Command};
use rosey::{RoseyCommand, RoseyOptions};
use std::str::FromStr;
use std::time::Instant;

#[tokio::main]
async fn main() {
    let start = Instant::now();

    let example_defaults = rosey::options::RoseyPublicConfig::default();

    let matches = Command::new("Rosey")
        .version(option_env!("RELEASE_VERSION").unwrap_or("Development"))
        .author("CloudCannon")
        .about("The CLI for the CloudCannon rosey package, an open-source tool for managing translations on static websites.")
        .subcommand_required(true)
        .arg(
            Arg::new("verbose")
                .long("verbose")
                .action(ArgAction::SetTrue)
                .help("Print verbose logs while running the Rosey CLI. Does not affect the output website")
        )
        .subcommand(
            Command::new("generate")
                .arg(
                    Arg::new("source")
                        .short('s')
                        .long("source")
                        .value_name("PATH")
                        .help("The directory of your built static website (the output folder of your SSG build)\n ! Required either in a config file or via the CLI"),
                )
                .arg(
                    Arg::new("version")
                        .short('v')
                        .long("version")
                        .value_parser(["1", "2"])
                        .value_name("VERSION")
                        .help(&format!(
                            "The Rosey locale version to generate and build from. \n ─ Defaults to '{}'",
                            example_defaults.version
                        )),
                )
                .arg(
                    Arg::new("tag")
                        .long("tag")
                        .value_name("ATTRIBUTE")
                        .help(&format!(
                            "The HTML attribute that Rosey should read from. \n ─ Defaults to '{}'",
                            example_defaults.tag
                        )),
                )
                .arg(
                    Arg::new("base")
                        .long("base")
                        .value_name("PATH")
                        .help(&format!(
                            "The file to generate the Rosey base locale file to. \n ─ Defaults to '{}'",
                            example_defaults.base.display()
                        )),
                )
                .arg(
                    Arg::new("base-urls")
                        .long("base-urls")
                        .value_name("PATH")
                        .help(&format!(
                            "The file to generate the Rosey base URLs file to. \n ─ Defaults to '{}'",
                            example_defaults.base_urls.display()
                        )),
                )
                .arg(
                    Arg::new("separator")
                        .long("separator")
                        .value_name("CHAR")
                        .help(&format!(
                            "The separator to use between Rosey namespaces when generating keys. \n ─ Defaults to '{}'",
                            example_defaults.separator
                        )),
                )
                .arg(
                    Arg::new("config-dump")
                        .long("config-dump")
                        .action(ArgAction::SetTrue)
                        .help("Print all resolved configuration and exit without taking any action"),
                ),
        )
        .subcommand(
            Command::new("build")
                .arg(
                    Arg::new("source")
                        .short('s')
                        .long("source")
                        .value_name("PATH")
                        .help("The directory of your built static website (the output folder of your SSG build)\n ! Required either in a config file or via the CLI"),
                )
                .arg(
                    Arg::new("dest")
                        .short('d')
                        .long("dest")
                        .value_name("PATH")
                        .help("The directory to output the multilingual site to. \n ─ Defaults to your source directory suffixed with _translated"),
                )
                .arg(
                    Arg::new("tag")
                        .long("tag")
                        .value_name("ATTRIBUTE")
                        .help(&format!(
                            "The HTML attribute that Rosey should read from. \n ─ Defaults to '{}'",
                            example_defaults.tag
                        )),
                )
                .arg(
                    Arg::new("locales")
                        .long("locales")
                        .value_name("PATH")
                        .help(&format!(
                            "The directory to read translated Rosey locale files from. \n ─ Defaults to '{}'",
                            example_defaults.locales.display()
                        )),
                )
                .arg(
                    Arg::new("default-language")
                        .long("default-language")
                        .value_name("LANG")
                        .help(&format!(
                            "The default language for the site (i.e. the language of 'base.json'). \n ─ Defaults to '{}'",
                            example_defaults.default_language
                        )),
                )
                .arg(
                    Arg::new("exclusions")
                        .long("exclusions")
                        .value_name("REGEX")
                        .help(&format!(
                            "A regular expression used to determine which files not to copy as assets. \n ─ Defaults to '{}'",
                            example_defaults.exclusions
                        )),
                )
                .arg(
                    Arg::new("separator")
                        .long("separator")
                        .value_name("CHAR")
                        .help(&format!(
                            "The separator to use between Rosey namespaces when generating keys. \n ─ Defaults to '{}'",
                            example_defaults.separator
                        )),
                )
                .arg(
                    Arg::new("images-source")
                        .long("images-source")
                        .value_name("PATH")
                        .help("The source folder that Rosey should look for translated images within. \n ─ Defaults to the source folder"),
                )
                .arg(
                    Arg::new("base-url")
                        .long("base-url")
                        .value_name("URL")
                        .help("The base URL for the site. Used to prefix alternate links. \n ─ Defaults to an empty string"),
                )
                .arg(
                    Arg::new("default-language-at-root")
                        .long("default-language-at-root")
                        .action(ArgAction::SetTrue)
                        .conflicts_with("redirect-page")
                        .help("Configures Rosey to leave all input URLs in-place for the default language, and omit generating redirect files"),
                )
                .arg(
                    Arg::new("redirect-page")
                        .long("redirect-page")
                        .value_name("PATH")
                        .help("Path to a redirect template that Rosey should use instead of the default file"),
                )
                .arg(
                    Arg::new("wrap")
                        .long("wrap")
                        .action(ArgAction::Append)
                        .help("For languages without significant whitespace, add spans around detected words to break lines cleanly")
                        .num_args(0..)
                )
                .arg(
                    Arg::new("wrap-class")
                        .long("wrap-class")
                        .value_name("CLASS")
                        .help("When wrapping languages, use the given classname instead of inline styles")
                )
                .arg(
                    Arg::new("serve")
                        .long("serve")
                        .action(ArgAction::SetTrue)
                        .help("Runs a local webserver on the dest folder after a successful build. Useful for local development")
                )
                .arg(
                    Arg::new("config-dump")
                        .long("config-dump")
                        .action(ArgAction::SetTrue)
                        .help("Print all resolved configuration and exit without taking any action"),
                ),
        )
        .subcommand(
            Command::new("check")
                .arg(
                    Arg::new("locales")
                        .long("locales")
                        .value_name("PATH")
                        .help(&format!(
                            "The directory to read translated Rosey locale files from. \n ─ Defaults to '{}'",
                            example_defaults.locales.display()
                        )),
                )
                .arg(
                    Arg::new("base")
                        .long("base")
                        .value_name("PATH")
                        .help(&format!(
                            "The path to a Rosey base locale file. \n ─ Defaults to '{}'",
                            example_defaults.base.display()
                        )),
                )
                .arg(
                    Arg::new("version")
                        .short('v')
                        .long("version")
                        .value_name("VERSION")
                        .value_parser(["1", "2"])
                        .help(&format!(
                            "The Rosey locale version to generate and build from. \n ─ Defaults to '{}'",
                            example_defaults.version
                        )),
                )
                .arg(
                    Arg::new("config-dump")
                        .long("config-dump")
                        .action(ArgAction::SetTrue)
                        .help("Print all resolved configuration and exit without taking any action"),
                ),
        )
        .get_matches();

    let (subcommand, submatches) = matches.subcommand().unwrap_or_else(|| {
        eprintln!("Failed to match any subcommand arguments");
        std::process::exit(1);
    });

    let subcommand = RoseyCommand::from_str(subcommand).unwrap_or_else(|e| {
        eprintln!("Error running Rosey: {e}");
        std::process::exit(1);
    });

    let options = RoseyOptions::load_with_flags(submatches, &subcommand);
    options.run(subcommand).await;

    let duration = start.elapsed();
    println!(
        "Rosey: Finished in {}.{} seconds",
        duration.as_secs(),
        duration.subsec_millis()
    );
}
