---
title: "Configuring Rosey"
nav_title: "Configuring Rosey"
nav_section: Rosey CLI
weight: 10
---

Rosey can be configured through CLI flags, environment variables, or configuration files. Values will be merged from all sources, with CLI flags overriding environment variables, and environment variables overriding configuration files.

## Config files

Rosey will look for a rosey.toml, rosey.yml, or rosey.json file in the directory that you run Rosey.

```yml
# rosey.yml
source: _site
dest: _site_translated
```

```bash
npx rosey
```

## Environment variables

Rosey will load any values via a ROSEY_* environment variable.

```bash
export ROSEY_DEST="_site_translated"
ROSEY_SOURCE="_site" npx rosey
```

## CLI flags

Rosey can be passed CLI flags directly.

```bash
npx rosey --source _site --dest _site_translated
```

## Common options

See the documentation for each Rosey subcommand for the available options. Some CLI flags are always available:

| CLI Flag                         | Description                                             |
|----------------------------------|---------------------------------------------------------|
| `-V, --version`                  | Print the version of the Rosey package                  |
| `-h, --help`                     | Print general help information                          |
| `<command> -h, <command> --help` | Print help information about a subcommand               |
| `<command> --config-dump`        | Print the config as sourced from all sources, then exit |
| `<command> --verbose`            | Print verbose logs while running the Rosey CLI          |
