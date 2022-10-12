---
title: "Translating JSON Files"
nav_title: "Translating JSON"
nav_section: Tagging
weight: 7
---

Rosey supports translation of JSON files using a schema file to determine the attributes to be translated. 

A Rosey schema file must live in the same folder as the original JSON file and should follow naming conventions of `<originalFileName>.rosey.json` — for example, to translate a file called `titles.json`, the schema should be named `titles.rosey.json`.

## Tagging JSON values

Adding a value of `rosey:<keyname>` will mark that value for translation under the given key.

Example `titles.json` file:
```json
{
    "myCollection": {
        "name": "Home Page",
        "title": "Home page title"
    }
}
```

Corresponding `titles.rosey.json` file:
```json
{
    "myCollection": {
        "name": "rosey:myCollection.name",
        "title": "rosey:myCollection.title"
    }
}
```

Output translation keys:

```json
{
  "myCollection.name": "Home Page",
  "myCollection.title": "Home page title"
}
```

## Namespacing JSON values

Adding a value of `rosey-ns` will define a nested namespace to be included as part of the translation key for any subsequent values.

Example `titles.json` file:
```json
{
    "myCollection": [
        {
            "name": "John",
            "details": {
                "description": "John description"
            }
        },
        {
            "name": "Mark",
            "details": {
                "description": "Mark description"
            }
        }
    ]
}
```

Corresponding `titles.rosey.json` file:
```json
{
    "myCollection": [
        {
            "name": "rosey-ns",
            "details": {
                "description": "rosey:description"
            }
        }
    ]
}
```

Output translation keys:

```json
{
  "john.description": "John description",
  "mark.description": "Mark description"
}
```

Values tagged with `rosey-ns` can also be translated by adding a `rosey` attribute after a pipe, for example to translate the name values we used as namespaces above:

`titles.rosey.json`:
{{< diffcode >}}
```json
{
    "myCollection": [
        {
+            "name": "rosey-ns|rosey:name",
            "details": {
                "description": "rosey:description"
            }
        }
    ]
}
```
{{< /diffcode >}}

Output translation keys:

{{< diffcode >}}
```json
{
+  "john.name": "John",
  "john.description": "John description",
+  "mark.name": "Mark",
  "mark.description": "Mark description"
}
```
{{< /diffcode >}}

## Translating JSON Arrays

When translating an array of strings, `rosey-array-ns` will allow you to use the string itself as a namespace within the array.


Example `titles.json` file:
```json
{
    "myCollection": [
        {
            "name": "John",
            "tags": [
                "cool",
                "blue",
                "round"
            ]
        },
        {
            "name": "Mark",
            "tags": [
                "green",
                "square",
                "top"
            ]
        }
    ]
}
```

Corresponding `titles.rosey.json` file:
```json
{
    "myCollection": [
        {
            "name": "rosey-ns|rosey:name",
            "tags": [ "rosey-array-ns|rosey:value" ],
        }
    ]
}
```

Output translation keys:

```json
{
    "john.name": "John",
    "john.blue.value": "blue",
    "john.cool.value": "cool",
    "john.round.value": "round",
    "mark.name": "Mark",
    "mark.green.value": "green",
    "mark.square.value": "square",
    "mark.top.value": "top",
}
```