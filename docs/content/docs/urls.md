---
title: "Translated URLs"
nav_title: "Translated URLs"
nav_section: Workflow
weight: 6
---

Rosey URL locale files can contain translated URLs for your website in a given language.

If you just want to move one language to the root of the site, e.g. serve `/en/index.html` at `index.html` instead, see the
[Default language at root](/docs/build/#default-language-at-root) option for Rosey's build step.

## Creating translated URL locale files

Creating URL locale files is not a step performed by Rosey. This part of the translation workflow is left open ended, usually integrating into an existing translation workflow for a company, or being programmatically created by transforming the input URLs.

Rosey will look for URL locale files alongside the standard locale files. For a file at `rosey/locales/es.json`, Rosey will look for URLs at `rosey/locales/es.urls.json`.

Locale files should be created based on the base URL file output from the [Rosey generate command](/docs/generate/). For the example base URL file:

```json
{
    "version": 2,
    "keys": {
        "index.html": {
            "original": "index.html"
        },
        "home/index.html": {
            "original": "home/index.html"
        },
        "posts/hello-world.html": {
            "original": "posts/hello-world.html"
        }
    }
}
```

The `rosey/locales/ja-jp.urls.json` locale file should match the structure:

```json
{
    "index.html": {
        "original": "index.html",
        "value": "index.html"
    },
    "home/index.html": {
        "original": "home/index.html",
        "value": "家/index.html"
    },
    "posts/hello-world.html": {
        "original": "posts/hello-world.html",
        "value": "投稿/こんにちは世界.html"
    }
}
```

Each of these keys is an object with `original` and `value` strings. The `value` string should contain the translated destination file, and will be used by Rosey when building your final multilingual site.

The output should always include the `.html` extension. Rosey will remove any trailing `index.html` filename where able.

All internal links to these files will be updated within the target locale.
