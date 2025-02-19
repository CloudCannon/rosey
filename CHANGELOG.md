# Changelog

<!--
    Add changes to the Unreleased section during development.
    Do not change this header — the GitHub action that releases
    this project will edit this file and add the version header for you.
    The Unreleased block will also be used for the GitHub release notes.
-->

## Unreleased

* Added the current language URL as an alternate tag on the page.

## v2.3.2 (February 17, 2025)

* Added configuration for Base URL to prefix alternate links.
  * See [Docs > Build > Base URL](https://rosey.app/docs/build/#base-url) for more information.

## v2.3.1 (December 2, 2024)

* Fix issue where Rosey would unescape characters that were entity encoded in the source HTML.

## v2.3.0 (October 31, 2024)

* Added `data-rosey-ignore` attribute to ignore hrefs when rewriting pages.
  * See [Docs > URLS](https://rosey.app/docs/urls/) for more information.

## v2.2.1 (August 28, 2024)

* Ensures the JSON output of the check command is sorted to avoid changes in git between runs

## v2.2.0 (August 15, 2024)

* Adds the ability to build the default language to the root path, rather than placing it under a language code.
  * See [Docs > Build > Default language at root](https://rosey.app/docs/build/#default-language-at-root) for more information.

## v2.1.1 (August 13, 2024)

* Fixes the Windows release of Rosey via npm

## v2.1.0 (June 18, 2024)

* Adds the ability to translate page URLs
  * See [Docs > Translating URLs](https://rosey.app/docs/urls/)
* Fixes an issue where some internal links with query strings or hash fragments would not be rewritten

## v2.0.5 (March 19, 2024)

* Fixes an issue where `<template>` elements were being ignored by generate and build.
* Fixes an issue where `rosey check` would error when run without a source

## v2.0.4 (March 16, 2023)

* `<title>`, `<script>` and `<style>` elements will no longer be wordwrapped when the `--wrap` flag is used.

## v2.0.3 (March 15, 2023)

* Add support for wordwrapping Thai, with `rosey build --wrap "th"`.

## v2.0.2 (March 1, 2023)

* Fixes an issue where asset attributes inside translation text would be deleted if they had no translation

## v2.0.1 (October 12, 2022)

* Use the x86_64 build of Rosey on M1 Macs

## v2.0.0 (October 12, 2022)

The first stable Rosey 2.0 release! 🎉

This release includes some breaking changes from Rosey 1.0, some of which are changes to previously undocumented behaviour. For anyone migrating from Rosey 1.0 to 2.0, the new documentation website at https://rosey.app should be read through to understand any differences between an existing implementation and the 2.0 feature-set.

Some of the larger changes include, but are not limited to:

- Renaming of the `rosey/source.json` file to `rosey/base.json`
- Renaming of commandline flags across all subcommands
- Changed and/or removed defaults of many Rosey options
- Changes to the way namespaces and roots interact with each other and themselves
