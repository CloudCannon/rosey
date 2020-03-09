# cli-i18n
The CLI for the CloudCannon i18n package.

Requires node >=10.0.0
<!-- 
[![Build Status](https://travis-ci.com/CloudCannon/cli-dist.svg?token=PCpTqbePqYxMDyjhMTKF&branch=master)](https://travis-ci.com/CloudCannon/cli-dist)
[![codecov](https://codecov.io/gh/CloudCannon/cli-dist/branch/master/graph/badge.svg?token=Q4yyn9DLZ6)](https://codecov.io/gh/CloudCannon/cli-dist) -->



## Contents
<ul>
    <li> Help
    <li> Generate
    <li> I18n
</ul>

# Commands


## Help
##### ```help```
Present the list of available commands

#### Example:

```
$ i18n help
```

## TODO: I18n
##### ```i18n```
Create translated version of your website for each "locale" file on the `i19n/locales/` folder. 

#### Example:

```
$ i18n
```

##  TODO: Build
##### ```build```
Builds the translated sites to the `dest` folder.

#### Example:

```
$ i18n build
```

## TODO: Serve
##### ```serve```
Runs a local webserver on the `dest` folder.

#### Example:

```
$ i18n serve
```

## TODO: Watch
##### ```watch```
Watches the `src` and `locale_src` folder to trigger builds.

#### Example:

```
$ i18n watch
```

## TODO: Legacy Update
##### ```legacy-update```
Converts locales to the legacy system.

#### Example:

```
$ i18n legacy-update
```

## TODO: Generate
##### ```generate```
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-i18n` key.
This generated locale is saved at `i18n/source.json`.

#### Example:

```
$ i18n generate
```

## TODO: Check
##### ```check```
Generates a comparison of i`18n/source.json` and `i18n/locales/*.json` at `i18n/checks.json`. This is not run as part of the `i18n` command.

#### Example:

```
$ i18n check
```

## TODO: Clean
##### ```clean```

Deletes the contents of the `dest` folder.

#### Example:

```
$ i18n clean
```

## TODO: Add character based wordwraps
##### ```add-character-based-wordwraps```
Creates a new locale for Japanese translations at `i18n/wrapped/`. This new locale has added span tags to wordwrap characters more appropriately. This requires a Google Cloud Natural Language API key to be set:

#### Example:

```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
$ i18n add-character-based-wordwraps
```
