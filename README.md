# Rosey

The CLI for the CloudCannon rosey package, an open-source tool for managing translations on static websites. 

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/rosey.svg?token=rzux5wJKxpiyCpqnmyMQ&branch=master)](https://travis-ci.com/CloudCannon/rosey)
[![codecov](https://codecov.io/gh/CloudCannon/rosey/branch/master/graph/badge.svg?token=SLXCH04SAM)](https://codecov.io/gh/CloudCannon/rosey)


## Installation

Using NPM:

```
$ npm i -g rosey
```

## Quick Start

1\. Mark up elements in HTML for translation with `data-rosey` attributes:
```html
 # test/src/index.html
 <h1 data-rosey="title">Welcome!</h1>
 ```
2\. Create `rosey/locales` folder and add `<language code>.json` files with corresponding keys and translations:
```json
# test/rosey/locales/es.json
{
  "title": "Bienvenido!"
}
```
3\. From project directory, run `rosey build -s path/to/src` (assuming Rosey installed globally).  
4\. View the site with available languages at `dist/translated_site`.

## Contents
-  [Tagging HTML](#tagging-html)
	- [Translating elements](#translating-elements)
	- [Translating attributes](#translating-attributes)
	- [Naming attributes explicitly](#Naming-attributes-explicitly)
	- [Namespace](#namespace)
-  [JSON Schema](#json-schema)
    - [rosey:tagName](#roseytagname)
    - [rosey-ns](#rosey-ns)
    - [rosey-array-ns](#rosey-array-ns)
-  [CLI usage](#cli-usage)
	-  [help](#help)
	-  [generate](#generate)
	-  [check](#check)
	-  [convert](#convert)
	-  [rosey](#rosey)
	-  [build](#build)
	-  [serve](#serve)
	-  [watch](#watch)
	-  [clean](#clean)
	-  [base](#base)
	-  [translate](#translate)
	-  [Japanese translations](#japanese-translations)
	-  [Required flags](#required-flags)

## Tagging HTML

Rosey works by looking into certain attributes added onto HTML tags to determine which contents require translations.

### Translating elements  

#### `data-rosey`  
All elements that require translation need the `data-rosey` attribute. On translation, the text content of the HTML element will be replaced with the appropriate translation.

Example: 
```html
<!DOCTYPE html>
<html>
    <body>
        <h1 data-rosey="title">Home page title</h1>
        <h2 data-rosey="sub-title">Home page subtitle</h2>
    </body>
</html>
```
Output translation keys:
```
{
  "sub-title":"",
  "title":"",
}
```

### Translating attributes

#### `data-rosey-attrs`  
With `data-rosey-attrs` you can translate multiple HTML attributes.

Example:
```html
<!DOCTYPE html>
<html>
    <body>
        <h1 data-rosey="title" data-rosey-attrs="content,alt" content="Content attribute" 
        alt="alt attribute">Home page title</h1>
        <h2 data-rosey="sub-title">Home page subtitle</h2>
    </body>
</html>
```
Output translation keys:
```
{
  "sub-title":"",
  "title":"",
  "title.alt":"",
  "title.content":"",
}
```

### Naming attributes explicitly

#### `data-rosey-attrs-explicit`
With `data-rosey-attrs-explicit` you can explicitly define the name of the key to be used on the translation files.
If the key name is shared with other attributes or elements, they all will have the same translation.

Example:
```html
<!DOCTYPE html>
<html>
    <body>
        <h1 data-rosey="title" data-rosey-attrs-explicit='{"content":"title","alt":"alt-tag"}'         content="Content attribute" alt="alt attribute">Home page title</h1>
        <h2 data-rosey="sub-title">Home page subtitle</h2>
    </body>
</html>
```
Output translation keys:
```
{
  "alt-tag":"",
  "sub-title":"",
  "title":"",
}
```

### Namespace

#### `data-rosey-root`
You can use `data-rosey-root` to define a SINGLE namespace to be included as part of the key for the translations.
The closest parent with `data-rosey-root` attribute will be used as the namespace. When an empty-string `data-rosey-root` attribute is included, no namespace is used for the child `data-rosey` and `data-rosey-attrs` attributes.
Any `data-rosey-root` attribute found will take priority over the `data-rosey-ns` attributes.

Example:
```html
<!DOCTYPE html>
<html>
  <head data-rosey-root='home:meta'>
    <title data-rosey='title'>Home title</title>
  </head>
  <body data-rosey-root='home:content'>
    <h1 data-rosey="title">Home page title</h1>
    <div data-rosey-root="">
      <p data-rosey="contact-us">...</p>
    </div>
  </body>
</html>
```

Output translation keys:
```
{
  "contact-us": ...
  "home:meta:title": …,
  "home:content:title": …
}
```

#### `data-rosey-ns`
Use `data-rosey-ns` to define nested namespaces to be included as part of the key for the translations. All parents of an element with a `data-rosey-ns` attribute will be used as the namespaces, concatenated with a colon.

Example:
```html
<!DOCTYPE html>
<html>
  <body>
    <div data-rosey-ns="about">
      <div data-rosey-ns="faq">
          <div data-rosey-ns="row-0">
            <div data-rosey-ns="col-0">
              <div data-rosey="title"></div>
            </div>
          </div>
          <div data-rosey-ns="row-1">
            <div data-rosey-ns="col-0">
              <div data-rosey="title"></div>
            </div>
          </div>
      </div>
      <div data-rosey-ns="benefits">
          <div data-rosey-ns="row-0">
            <div data-rosey-ns="col-0">
              <div data-rosey="title"></div>
            </div>
          </div>
          <div data-rosey-ns="row-1">
            <div data-rosey-ns="col-0">
              <div data-rosey="title"></div>
            </div>
          </div>
      </div>
    </div>
  </body>
</html>
```

Output translation keys:
```
{
  "about:benefits:row-0:col-0:title":…,
  "about:benefits:row-1:col-0:title":…,
  "about:faq:row-0:col-0:title":…,
  "about:faq:row-1:col-0:title":…,
}
```


## JSON Schema
Rosey supports translation of JSON files using a schema file to determine the attributes to be translated.

The schema file must live in the same folder as the original JSON file and should follow naming conventions of `*originalFileName*.rosey.json`

For example, to translate a file called `titles.json`, the schema should be named `titles.rosey.json`.

### `rosey:tagName`

Defines that the element will be added as a tag to be translated. The string after the column will be used as the tag name.

Example `titles.json`:

```
{
	"myCollection" : {
			"name": "Home Page",
      "title: "Home page title"
		}
}
```

Corresponding `title.rosey.json` schema file:
```
{
	"myCollection": {
			"name": "rosey:myCollection.name",
			"title": "rosey:myCollection.title"
		}
}
```

Output translation keys generated:
```
{
  "myCollection.name":…,
  "myCollection.title":…
}
```

### `rosey-ns`
`rosey-ns` is used to define nested namespaces to be included as part of the key for the translations. The value of the element defined as `rosey-ns` will be used as part of the tag name.
All the parents from the element with a `rosey-ns` tag will be used as the namespaces concatenated with a dot.

Example JSON file:

```
{
	"myCollection": [
		{
			"name": "John",
			"details": {
				"description": "This is a cool description"
			}
		},
		{
			"name": "Mark",
			"details": {
				"description": "Big description"
			}
		}
	]
}
```

Corresponding schema file:
```
{
	"myCollection": [
		{
			"name": "rosey-ns|rosey:name",
			"details": {
				"description": "rosey:details.description"
			}
		}
	]
}
```

Output translation keys generated:
```
{
  "john.name":…,
  "john.details.description":…,
  "mark.name":…,
  "mark.details.description":…
}
```

### `rosey-array-ns`
`rosey-array-ns` is used when you have an array where the values need to be translated. The value of the element defined as `rose-array-ns` will be used as part of the tag name.

Example JSON file:
```
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

Corresponding schema file:
```
{
	"myCollection": [
		{
			"name": "rosey-ns|rosey:name",
			"tags": [ "rosey-array-ns|rosey:value" ],
		}
	]
}
```

Output translation keys generated:
```
{
  "john.name":…,
  "john.blue.value":…,
  "john.cool.value":…,
  "john.round.value":…,
  "mark.name":…,
  "mark.green.value":…,
  "mark.square.value":…,
  "mark.top.value":…,
}
```

## CLI usage

```
$ rosey <command> [args]
```

### `help`
Present the list of available commands

#### Example:

```
$ rosey help
```

### `generate`
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-rosey` key.
The generated locale source is saved by default at `rosey/source.json`.

#### Example:

```
$ rosey generate [<source>|<version>|<tag>|<locale-dest>|<source-delimiter>]
```

### `check`
Generates a comparison of `rosey/source.json` and `rosey/locales/*.json` at `rosey/checks.json`. This is not run as part of the `rosey` command.

#### Example:

```
$ rosey check [<version>|<locale-source>|<locale-dest>]
```

### `convert`
If you still have `locales` files using version 1, you can use the `convert` command to migrate the current translations to version 2.
It will need an existing `source.json` file on with version 2 file as the base for the new locales files. 
It is recommended to run `rosey generate --version 2` before using the `convert` command.

#### Example:

```
$ rosey convert [<locale-source>|<locale-dest>]
```

### `rosey`
Create translated version of your website for each "locale" file on the `rosey/locales/` folder. 
Serves the translated version on a local browser and watches for changes.

#### Example:

```
$ rosey [<source>|<dest>|<credentials>|<yes>|<version>|<port>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```

### `build`
Builds the translated sites to the `dest` folder.

#### Example:

```
$ rosey build [<source>|<dest>|<credentials>|<yes>|<tag>|<locale-source>|<default-language>]
```

### `serve`
Runs a local webserver on the `dest` folder.

#### Example:

```
$ rosey serve [<dest>|<port>]
```

### `watch`
Watches the `source` and `locale_source` folders.
A ``build`` is triggered when the `source` files are modified.
A ``generate`` is triggered when the `locale_source` files are modified.

#### Example:

```
$ rosey watch [<source>|<credentials>|<yes>|<version>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```

### `clean`

Deletes the contents of the `dest` folder.

#### Example:

```
$ rosey clean [<dest>|<yes>]
```

### `base`

Copies assets and creates the redirect page into the `dest` folder. Use `translate` to generate the translated websites.

#### Example:

```
$ rosey base [<source>|<dest>|<tag>|<locale-source>|<default-language>]
```


### `translate`

Generates a translated version of the websites on `dest` for the specified languages only.

#### Example:

```
$ rosey translate [<source>|<dest>|<languages>|<credentials>|<tag>|<locale-source>]
```

### Japanese translations
When translating for Japanese websites, the translated content from the `locales` folder will have `span` tags added to wordwrap characters more appropriately. 
This requires a [Google Cloud Natural Language API key](https://cloud.google.com/natural-language/docs/quickstart) to be set.
You can either use an argument when calling the CLI command, or set the specific environment variable.

#### Example:

```
$ rosey build --credentials /PATH/TO/CREDENTIALS/google-creds.json
```
or
```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
```

### Required flags:
[-l | --languages ]