# Changelog

<!-- 
    Add changes to the Unreleased section during development.
    Do not change this header — the GitHub action that releases
    this project will edit this file and add the version header for you.
    The Unreleased block will also be used for the GitHub release notes.
-->

## Unreleased

## v2.0.0 (October 12, 2022)

The first stable Rosey 2.0 release! 🎉

This release includes some breaking changes from Rosey 1.0, some of which are changes to previously undocumented behaviour. For anyone migrating from Rosey 1.0 to 2.0, the new documentation website at https://rosey.app should be read through to understand any differences between an existing implementation and the 2.0 feature-set.

Some of the larger changes include, but are not limited to:

- Renaming of the `rosey/source.json` file to `rosey/base.json`
- Renaming of commandline flags across all subcommands
- Changed and/or removed defaults of many Rosey options
- Changes to the way namespaces and roots interact with each other and themselves
