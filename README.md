# rosey
The CLI for the CloudCannon rosey package.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/cli-i18n.svg?token=jVQhfYdhP37TyCuAVfft&branch=master)](https://travis-ci.com/CloudCannon/cli-i18n)
[![codecov](https://codecov.io/gh/CloudCannon/cli-i18n/branch/master/graph/badge.svg?token=SLXCH04SAM)](https://codecov.io/gh/CloudCannon/cli-i18n)



## Contents
<ul>
    <li> <a href="#help">Help</a>
    <li> <a href="#generate">Generate</a>
    <li> <a href="#check">Check</a>
    <li> <a href="#convert">Convert</a>
    <li> <a href="#rosey">Rosey</a>
    <li> <a href="#build">Build</a>
    <li> <a href="#serve">Serve</a>
    <li> <a href="#watch">Watch</a>
    <li> <a href="#clean">Clean</a>
    <li> <a href="#base">Base</a>
    <li> <a href="#translate">Translate</a>
</ul>

## Install

```
$ npm install rosey --save-dev
```

or simpy run with npx

```
$ npx rosey rosey
```

## Synopsis

```
$ rosey <command> [args]
```

## Usage


### Help
##### ```help```
Present the list of available commands

#### Example:

```
$ rosey help
```

### Generate
##### ```generate```
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-rosey` key.
The generated locale source is saved at `rosey/source.json`.

#### Example:

```
$ rosey generate [<source>|<version>|<tag>|<locale-dest>|<source-delimiter>]
```

### Check
##### ```check```
Generates a comparison of `rosey/source.json` and `rosey/locales/*.json` at `rosey/checks.json`. This is not run as part of the `rosey` command.

#### Example:

```
$ rosey check [<version>|<locale-source>|<locale-dest>]
```

### Convert
##### ```convert```
If you still have `locales` files using version 1, you can use the `convert` command to migrate the current translations to version 2.
It will need an existing `source.json` file on with version 2 file as the base for the new locales files. 
It is recommended to run `rosey generate --version 2` before using the `convert` command.

#### Example:

```
$ rosey convert [<locale-source>|<locale-dest>]
```

### Rosey
##### ```rosey```
Create translated version of your website for each "locale" file on the `rosey/locales/` folder. 
Serves the translated version on a local browser and watches for changes.

#### Example:

```
$ rosey [<source>|<dest>|<credentials>|<yes>|<version>|<port>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```

### Build
##### ```build```
Builds the translated sites to the `dest` folder.

#### Example:

```
$ rosey build [<source>|<dest>|<credentials>|<yes>|<tag>|<locale-source>|<default-language>]
```

##### Japanese translations
When translating for a Japanese website the translated content from the locales folder will have span tags added to wordwrap characters more appropriately. 
This requires a [Google Cloud Natural Language API key](https://cloud.google.com/natural-language/docs/quickstart) to be set.
You can either use a argument when calling the CLI command, or set the specific environment variable.

#### Example:

```
$ rosey build --credentials /PATH/TO/CREDENTIALS/google-creds.json
```
or
```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
```

### Serve
##### ```serve```
Runs a local webserver on the `dest` folder.

#### Example:

```
$ rosey serve [<dest>|<port>]
```

### Watch
##### ```watch```
Watches the `source` and `locale_source` folders.
A ``build`` is triggered when the `source` files are modified.
A ``generate`` is triggered when the `locale_source` files are modified.

#### Example:

```
$ rosey watch [<source>|<credentials>|<yes>|<version>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```


### Clean
##### ```clean```

Deletes the contents of the `dest` folder.

#### Example:

```
$ rosey clean [<dest>|<yes>]
```

### Base
##### ```base```

Copy assets and creates the redirect page into the `dest` folder. Use `translate` to generate the translated websites.

#### Example:

```
$ rosey base [<source>|<dest>|<tag>|<locale-source>|<default-language>]
```


### Translate
##### ```translate```

Generates a translated version of the websites on `dest` for the specified languages only.

#### Example:

```
$ rosey translate [<source>|<dest>|<languages>|<credentials>|<tag>|<locale-source>]
```

#### Required flags:
[-l | --languages ]