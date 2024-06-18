---
title: "Rosey Checks File"
nav_title: "Rosey Checks File"
nav_section: Workflow
weight: 7
---

The Rosey checks file highlights any discrepancies between your base translation file and your translated locale files, such as out of date or missing translations.

## Creating the checks file

At the end of your translation workflow, after running Rosey [generate](/docs/generate/) and creating [translated locale files](/docs/locales/), you will have a `rosey` directory structure such as:

{{< tree >}}
rosey/
>> locales/
>  >> fr-fr.json
>  >> ko-kr.json
>> base.json
{{< /tree >}}

With these files in place you can run the Rosey [check](/docs/check/) command, which will generate a file in the following location:

{{< tree >}}
rosey/
>> locales/
>  >> fr-fr.json
>  >> ko-kr.json
>> base.json
+>> checks.json
{{< /tree >}}

In this case, this new `checks.json` file contains a report on the state of the `ko-kr` and `fr-fr` locales compared to the `base.json` file. The contents of this file will look something like:

```json
{
  "fr-fr": {
    "current": true,
    "baseTotal": 2,
    "total": 2,
    "states": {
      "unused": 0,
      "current": 2,
      "outdated": 0,
      "missing": 0
    },
    "keys": {
      "title": "current",
      "content": "current"
    }
  },
  "ko-kr": {
    "current": false,
    "baseTotal": 2,
    "total": 2,
    "states": {
      "unused": 0,
      "current": 0,
      "outdated": 1,
      "missing": 1
    },
    "keys": {
      "title": "outdated",
      "content": "missing",
      "name": "unused"
    }
  }
}
```

For each translated locale, and each translation key, one of the following statuses will be reported:

- `current`
  - A translation for this key exists, and the `original` value matches that of the `base.json` file.
- `outdated`
  - A translation for this key exists, but the `original` value does not match the `base.json`, meaning that this translation is out of date and should be re-processed,
- `missing`
  - This key exists in the `base.json`, but does not exist in this locale file.
- `unused`
  - This key exists in this locale file, but the `base.json` contains no such key, so this translation will not be used anywhere on the site.
