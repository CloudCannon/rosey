---
title: "Rosey Build"
nav_title: "Rosey Build"
nav_section: Rosey CLI
weight: 12
---

Rosey's `build` command ingests your built static site along with any locale files, and produces a multilingual site ready to deploy.

## CLI flags

### Serve
Runs a local webserver on the dest folder after a successful build.

| CLI Flag  |
|-----------|
| `--serve` |

## Required options

### Source
The directory of your built static website (the output folder of your SSG build).

| CLI Flag            | ENV Variable   | Config Key |
|---------------------|----------------|------------|
| `--source <SOURCE>` | `ROSEY_SOURCE` | `source`   |

## Options

### Dest
The directory to output the multilingual site to. Defaults to your source directory suffixed with `_translated`

| CLI Flag       | ENV Variable | Config Key |
|----------------|--------------|------------|
| `--dest <DIR>` | `ROSEY_DEST` | `dest`     |

### Locales

The directory to read translated Rosey locale files from. Defaults to `rosey/locales`

| CLI Flag          | ENV Variable    | Config Key |
|-------------------|-----------------|------------|
| `--locales <DIR>` | `ROSEY_LOCALES` | `locales`  |

### Default language

The default language for the site (i.e. the language of 'source.json'). Defaults to `en`

| CLI Flag                      | ENV Variable             | Config Key         |
|-------------------------------|--------------------------|--------------------|
| `--default-language <STRING>` | `ROSEY_DEFAULT_LANGUAGE` | `default_language` |

### Exclusions

A regular expression used to determine which files not to copy as assets. Defaults to `\.(html?|json)$`

| CLI Flag               | ENV Variable       | Config Key   |
|------------------------|--------------------|--------------|
| `--exclusions <REGEX>` | `ROSEY_EXCLUSIONS` | `exclusions` |

### Images source

The source folder that Rosey should look for translated images within. If omitted, Rosey will look for images in the source folder.

| CLI Flag                | ENV Variable          | Config Key      |
|-------------------------|-----------------------|-----------------|
| `--images-source <DIR>` | `ROSEY_IMAGES_SOURCE` | `images_source` |

### Redirect page

Path to a custom redirect template that Rosey should use for the base URL.

| CLI Flag                 | ENV Variable          | Config Key      |
|--------------------------|-----------------------|-----------------|
| `--redirect-page <FILE>` | `ROSEY_REDIRECT_PAGE` | `redirect_page` |

### Separator

The separator that was used between Rosey namespaces when generating keys. Defaults to `:`

| CLI Flag             | ENV Variable      | Config Key  |
|----------------------|-------------------|-------------|
| `--separator <CHAR>` | `ROSEY_SEPARATOR` | `separator` |

### Tag

The HTML attribute prefix that Rosey should read from. Defaults to `data-rosey`

| CLI Flag         | ENV Variable | Config Key |
|------------------|--------------|------------|
| `--tag <STRING>` | `ROSEY_TAG`  | `tag`      |
