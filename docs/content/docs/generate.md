---
title: "Rosey Generate"
nav_title: "Rosey Generate"
nav_section: Rosey CLI
weight: 11
---

Rosey's `generate` command ingests your built static site, and produces a `base.json` file containing all content that needs to be translated.

## Required options

### Source
The directory of your built static website (the output folder of your SSG build).

| CLI Flag            | ENV Variable   | Config Key |
|---------------------|----------------|------------|
| `--source <SOURCE>` | `ROSEY_SOURCE` | `source`   |

## Options

### Base

The path to generate the Rosey base locale file to. Defaults to `rosey/base.json`

| CLI Flag        | ENV Variable | Config Key |
|-----------------|--------------|------------|
| `--base <FILE>` | `ROSEY_BASE` | `base`     |

### Base URLs

The path to generate the Rosey base urls file to. Defaults to `rosey/base.urls.json`

| CLI Flag             | ENV Variable      | Config Key  |
|----------------------|-------------------|-------------|
| `--base-urls <FILE>` | `ROSEY_BASE_URLS` | `base_urls` |

### Separator

The separator to use between Rosey namespaces when generating keys. Defaults to `:`

| CLI Flag             | ENV Variable      | Config Key  |
|----------------------|-------------------|-------------|
| `--separator <CHAR>` | `ROSEY_SEPARATOR` | `separator` |

### Tag

The HTML attribute prefix that Rosey should read from. Defaults to `data-rosey`

| CLI Flag         | ENV Variable | Config Key |
|------------------|--------------|------------|
| `--tag <STRING>` | `ROSEY_TAG`  | `tag`      |

### Version

The Rosey locale version to generate and build from. Version 1 should only be used for compatibility with legacy sites. Defaults to version `2`

| CLI Flag             | ENV Variable    | Config Key |
|----------------------|-----------------|------------|
| `--version <NUMBER>` | `ROSEY_VERSION` | `version`  |
