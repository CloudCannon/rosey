---
title: "Rosey Check"
nav_title: "Rosey Check"
nav_section: Rosey CLI
weight: 13
---

Rosey's `check` command compares your `base.json` translation file against your `rosey/locales/*` locale files. This command will highlight any translations that are missing in your locale files, as well as any translations that are out of date and need to be updated.

## Options

### Base

The path to read the Rosey base locale file from. Defaults to `rosey/base.json`

| CLI Flag        | ENV Variable | Config Key |
|-----------------|--------------|------------|
| `--base <FILE>` | `ROSEY_BASE` | `base`     |

### Locales

The directory to read translated Rosey locale files from. Defaults to `rosey/locales`

| CLI Flag          | ENV Variable    | Config Key |
|-------------------|-----------------|------------|
| `--locales <DIR>` | `ROSEY_LOCALES` | `locales`  |
