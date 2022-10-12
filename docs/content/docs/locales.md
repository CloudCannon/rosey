---
title: "Translated Locale Files"
nav_title: "Translated Locale Files"
nav_section: Workflow
weight: 5
---

Rosey locale files contain the translated text for your website in a given language, as derived from the text contained in the [base locale file](/docs/base-locale/).

## Creating translated locale files

Creating locale files is not a step performed by Rosey. This part of the translation workflow is left open ended, usually integrating into an existing translation workflow for a company, or being created by a multilingual developer in the source.

Rosey expects a directory of locale files, each named by the locale they target. By default, Rosey looks in the `rosey/locales` folder relative to the directory you run Rosey in.

Locale files should be created based on the base locale file output from the [Rosey generate command](/docs/generate/). For the example base locale:

```json
{
    "version": 2,
    "keys": {
        "title": {
            "original": "My Website",
            "pages": {
                "index.html": 1
            },
            "total": 1
        },
        "about:label": {
            "original": "About Me",
            "pages": {
                "index.html": 1,
                "about.html": 2
            },
            "total": 3
        }
    }
}
```

The `rosey/locales/ja-jp` locale file should match the structure:

```json
{
    "title": {
        "original": "My Website",
        "value": "私のウェブサイト"
    },
    "about:label": {
        "original": "About Me",
        "value": "私について"
    }
}
```

Each top-level key in a locale file should exist at `keys.<key>` in the base locale file.

Each of these keys is an object with `original` and `value` strings. The `value` string should contain the translated text for this translation key, and will be used by Rosey when building your final multilingual site. 

The `original` string should be copied over from the base locale at the time of translation, and will be used by the [Rosey check](/docs/check/) command to identify translations that are out of date.
