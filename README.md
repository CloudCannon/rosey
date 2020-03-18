# cli-i18n
The CLI for the CloudCannon i18n package.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/cli-i18n.svg?token=jVQhfYdhP37TyCuAVfft&branch=master)](https://travis-ci.com/CloudCannon/cli-i18n)
[![codecov](https://codecov.io/gh/CloudCannon/cli-i18n/branch/master/graph/badge.svg?token=SLXCH04SAM)](https://codecov.io/gh/CloudCannon/cli-i18n)



## Contents
<ul>
    <li> <a href="#help">Help</a>
    <li> <a href="#i18n">I18n</a>
    <li> <a href="#build">Build</a>
    <li> <a href="#serve">Serve</a>
    <li> <a href="#watch">Watch</a>
    <li> <a href="#generate">Generate</a>
    <li> <a href="#check">Check</a>
    <li> <a href="#clean">Clean</a>
</ul>

## Install

```
$ npm install @cloudcannon/i18n
```

## Synopsis

```
$ i18n <command> [args]
```

## Usage


### Help
##### ```help```
Present the list of available commands

#### Example:

```
$ i18n help
```

### I18n
##### ```i18n```
Create translated version of your website for each "locale" file on the `i18n/locales/` folder. 
Serves the translated version on a local browser and watches for changes.

#### Example:

```
$ i18n [<source>|<dest>|<override>|<version>]
```

### Build
##### ```build```
Builds the translated sites to the `dest` folder.

#### Example:

```
$ i18n build [<source>|<dest>|<override>]
```

##### Japanese translations
When translating for a Japanese website the translated content from the locales folder will have span tags added to wordwrap characters more appropriately. 
This requires a [Google Cloud Natural Language API key](https://cloud.google.com/natural-language/docs/quickstart) to be set. 

#### Example:

```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
```


### Serve
##### ```serve```
Runs a local webserver on the `dest` folder.

#### Example:

```
$ i18n serve [<dest>|<version>]
```

### Watch
##### ```watch```
Watches the `source` and `locale_source` folders.
A ``build`` is triggered when the `source` files are modified.
A ``generate`` is triggered when the `locale_source` files are modified.

#### Example:

```
$ i18n watch [<source>|<dest>|<override>|<version>]
```

### Generate
##### ```generate```
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-i18n` key.
This generated locale is saved at `i18n/source.json`.

#### Example:

```
$ i18n generate [<source>|<version>]
```

### Check
##### ```check```
Generates a comparison of `i18n/source.json` and `i18n/locales/*.json` at `i18n/checks.json`. This is not run as part of the `i18n` command.

#### Example:

```
$ i18n check [<version>]
```

### Clean
##### ```clean```

Deletes the contents of the `dest` folder.

#### Example:

```
$ i18n clean [<dest>]
```
