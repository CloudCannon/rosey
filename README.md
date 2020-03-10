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
    <li> <a href="#legacy-update">Legacy Update</a>
    <li> <a href="#generate">Generate</a>
    <li> <a href="#check">Check</a>
    <li> <a href="#clean">Clean</a>
    <li> <a href="#add-character-based-wordwraps">Add character based wordwraps</a>
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
TODO:
##### ```i18n```
Create translated version of your website for each "locale" file on the `i18n/locales/` folder. 

#### Example:

```
$ i18n [<source>|<dest>|<override>]
```

### Build
TODO:
##### ```build```
Builds the translated sites to the `dest` folder.

#### Example:

```
$ i18n build [<source>|<dest>|<override>]
```

### Serve
TODO:
##### ```serve```
Runs a local webserver on the `dest` folder.

#### Example:

```
$ i18n serve
```

### Watch
TODO:
##### ```watch```
Watches the `src` and `locale_src` folder to trigger builds.

#### Example:

```
$ i18n watch
```

### Legacy Update
TODO:
##### ```legacy-update```
Converts locales to the legacy system.

#### Example:

```
$ i18n legacy-update
```

### Generate
TODO:
##### ```generate```
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-i18n` key.
This generated locale is saved at `i18n/source.json`.

#### Example:

```
$ i18n generate
```

### Check
TODO:
##### ```check```
Generates a comparison of i`18n/source.json` and `i18n/locales/*.json` at `i18n/checks.json`. This is not run as part of the `i18n` command.

#### Example:

```
$ i18n check
```

### Clean
##### ```clean```

Deletes the contents of the `dest` folder.

#### Example:

```
$ i18n clean [<dest>]
```

### Add character based wordwraps
TODO:
##### ```add-character-based-wordwraps```
Creates a new locale for Japanese translations at `i18n/wrapped/`. This new locale has added span tags to wordwrap characters more appropriately. This requires a Google Cloud Natural Language API key to be set:

#### Example:

```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
$ i18n add-character-based-wordwraps
```
