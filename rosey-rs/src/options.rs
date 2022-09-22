use std::{fmt::Display, path::PathBuf};

use anyhow::Error;
use figment::{
    providers::{Env, Format, Json, Serialized, Toml, Yaml},
    Figment,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RoseyPublicConfig {
    pub source: PathBuf,
    pub dest: PathBuf,
    pub version: u8,
    pub tag: String,
    pub separator: String,
    pub base: PathBuf,
    pub locales: PathBuf,
    pub languages: Option<Vec<String>>,
    pub exclusions: String,
    pub images_source: Option<PathBuf>,
    pub default_language: String,
    pub redirect_page: Option<PathBuf>,
    pub verbose: bool,
}

impl Default for RoseyPublicConfig {
    fn default() -> RoseyPublicConfig {
        RoseyPublicConfig {
            source: "".into(),
            dest: "".into(),
            version: 2,
            tag: "data-rosey".into(),
            separator: ":".into(),
            base: "rosey/base.json".into(),
            locales: "rosey/locales".into(),
            languages: None,
            exclusions: r#"\.(html?|json)$"#.into(),
            images_source: None,
            default_language: "en".into(),
            redirect_page: None,
            verbose: false,
        }
    }
}

pub fn load_config_files() -> Result<RoseyPublicConfig, Error> {
    let figment = Figment::from(Serialized::defaults(RoseyPublicConfig::default()))
        .merge(Toml::file("rosey.toml"))
        .merge(Yaml::file("rosey.yaml"))
        .merge(Yaml::file("rosey.yml"))
        .merge(Json::file("rosey.json"))
        .merge(Env::prefixed("ROSEY_"));

    figment.extract().map_err(Into::into)
}

impl Display for RoseyPublicConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Resolved Rosey Configuration:")?;
        writeln!(f, "  Paths:")?;
        writeln!(f, "   - Source:              {}", self.source.display())?;
        writeln!(f, "   - Destination:         {}", self.dest.display())?;
        writeln!(f, "   - Base Locale File:       {}", self.base.display())?;
        writeln!(f, "   - Locales Directory:  {}", self.locales.display())?;
        match &self.images_source {
            Some(s) => writeln!(f, "   - Images Source:       {}", s.display())?,
            None => writeln!(
                f,
                "   - Images Source:       * unset, using source directory *"
            )?,
        }
        match &self.redirect_page {
            Some(s) => writeln!(f, "   - Redirect Page:       {}", s.display())?,
            None => writeln!(
                f,
                "   - Redirect Page:       * unset, using default redirect template *"
            )?,
        }

        writeln!(f, "  Options:")?;
        writeln!(f, "   - Default Language:    {}", self.default_language)?;
        writeln!(f, "   - Locale Version:      {}", self.version)?;
        writeln!(f, "   - Tag:                 {}", self.tag)?;
        writeln!(f, "   - Separator:           {}", self.separator)?;
        writeln!(f, "   - Exclusions:          {}", self.exclusions)?;
        match &self.languages {
            Some(langs) => writeln!(f, "   - Languages:           {}", langs.join(", "))?,
            None => writeln!(
                f,
                "   - Languages:           * none passed, outputting all available languages *"
            )?,
        }

        write!(f, "")
    }
}
