# rosey
The CLI for the CloudCannon rosey package.

Requires node >=10.0.0

[![Build Status](https://travis-ci.com/CloudCannon/rosey.svg?token=rzux5wJKxpiyCpqnmyMQ&branch=master)](https://travis-ci.com/CloudCannon/rosey)
[![codecov](https://codecov.io/gh/CloudCannon/rosey/branch/master/graph/badge.svg?token=SLXCH04SAM)](https://codecov.io/gh/CloudCannon/rosey)



## Contents
<ul>
    <li> <a href="#installation">Installation</a>
    <li> <a href="#html-tags">HTML tags</a>
    <li> <a href="#help">Help</a>
    <li> <a href="#generate">Generate</a>
    <li> <a href="#check">Check</a>
    <li> <a href="#convert">Convert</a>
    <li> <a href="#rosey">Rosey</a>
    <li> <a href="#build">Build</a>
    <li> <a href="#serve">Serve</a>
    <li> <a href="#watch">Watch</a>
    <li> <a href="#clean">Clean</a>
    <li> <a href="#base">Base</a>
    <li> <a href="#translate">Translate</a>
</ul>

## Installation

### Using NPX
You can use the rosey package without installing it.
For that, you will need to run `npx` which will download and cache a version of the package

```
$ npx rosey rosey <command> [args]
```
### Installing globally
You can install it globally
```
$ npm install rosey -g
```

And then just run the commands from any project
```
$ rosey <command> [args]
```
### Using package.json
You can also install rosey on a specific project only
```
$ npm install rosey --save-dev
```
#### Running with npx
To run from the local package, use `npx`. It will look for the locally installed or globally installed package before downloading and caching the latest version.

```
$ npx rosey <command> [args]
```

#### Running with scripts
Alternatively, you can call it using the `packages.json` scripts.
You will need to add the following on your `packages.json` file
```
  "scripts": {
    "rosey": "rosey"
  },
```
And then run
```
$ npm run rosey <commands> [args]
```

#### Running with index.js
Another option is calling directly the index.js file installed on the `node_modules` folder.
```
$ node_modules/rosey/index.js <command> [args]
```

## HTML tags
Rosey works looking into certain html tags added into the HTML to determine which contents require transalations.

### Element
#### `data-rosey`

`data-rosey` will be included on all the elements that require translation. 
On translation, the whole HTML content between the element will be replaced with the appropriate translation.

With the given example
```
<!DOCTYPE html>
<html>
  <body>
    <h1 data-rosey=”title”>Home page title</h1>
    <h2 data-rosey=”sub-title”>Home page sub title</h1>
  </body>
</html>

```
The output translation keys generate are:
```
{
  "sub-title":"",
  "title":"",
}
```

### Attributes
### `data-rosey-attrs`
```
<!DOCTYPE html>
<html>
  <body>
    <h1 data-rosey=”title” data-rosey-attrs="content,alt" content="Content attribute" alt="alt attribute">Home page title</h1>
    <h2 data-rosey=”sub-title”>Home page sub title</h1>
  </body>
</html>

```
The output translation keys generate are:
```
{
  "sub-title":"",
  "title":"",
  "title.alt":"",
  "title.content":"",
}
```


### Attributes explicit tags
### `data-rosey-attrs-explicit`
Using `data-rosey-attrs-explicit` you are able to explicitly define the name of the key to be used on the translation files.
If the key name is shared with other attributes or elements, they all will have the same translation.

```
<!DOCTYPE html>
<html>
  <body>
    <h1 data-rosey=”title” data-rosey-attrs-explicit='{"content":"title","alt":"alt-tag"}' content="Content attribute" alt="alt attribute">Home page title</h1>
    <h2 data-rosey=”sub-title”>Home page sub title</h1>
  </body>
</html>

```
The output translation keys generate are:
```
{
  "alt-tag":"",
  "sub-title":"",
  "title":"",
}
```


### Namespace
#### `data-rosey-root`
`data-rosey-root` is used to define a SINGLE namespace to be included as part of the key for the translations.
The closest parent with `data-rosey-root` tag will be used as the namespace. When an empty string `data-rosey-root` tag is included, no namespace is used for the child `data-rosey` and `data-rosey-attrs` tags.
Any `data-rosey-root` tag found will take priority over the `data-rosey-ns` tags.


With given example
```
<!DOCTYPE html>
<html>
  <head data-rosey-root='home:meta'>
    <title data-rosey='title'>Home title</title>
  </head>
  <body data-rosey-root='home:content'>
    <h1 data-rosey=”title”>Home page title</h1>
    <div data-rosey-root=””>
      <p data-rosey=”contact-us”>...</p>
    </div>
  </body>
</html>
```

The output translation keys generated are:
```
{
  “contact-us”: ...
  "home:meta:title": …,
  "home:content:title": …
}
```

#### `data-rosey-ns`
`data-rosey-ns` is used to define nested namespaces to be included as part of the key for the translations.
All the parents from the element with a `data-rosey-ns` tag will be used as the namespaces concatenated with a colon.


With given example
```
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

The output translation keys generated are:
```
{
  "about:benefits:row-0:col-0:title":…,
  "about:benefits:row-1:col-0:title":…,
  "about:faq:row-0:col-0:title":…,
  "about:faq:row-1:col-0:title":…,
}
```

## JSON Schema
Rosey supports translation of JSON file using a schema file to determine the attributes to be translated.

The schema file will live on the same folder of the original JSON file and should be name as `*originalFileName*.rosey.json`

Eg.: To translate a file called `titles.json`, the schema should be named as `titles.rosey.json`.

### `rosey:tagName`

Defines that the element will be added as a tag to be translated. The string after the collumn will be used as the tag name.

With given example

```
{
	"myCollection" : {
			"name": "Home Page",
      "title: "Home page title"
		}
}
```

We can have the following schema file:
```
{
	"myCollection": {
			"name": "rosey:myCollection.name",
			"title": "rosey:myCollection.title"
		}
}
```

The output translation keys generated are:
```
{
  "myCollection.name":…,
  "myCollection.title":…
}
```

### `rosey-ns`
`rosey-ns` is used to define nested namespaces to be included as part of the key for the translations. The value of the element defined as `rose-ns` will be used as part of the tag name.
All the parents from the element with a `rosey-ns` tag will be used as the namespaces concatenated with a dot.

With given example

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

We can have the following schema file:
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

The output translation keys generated are:
```
{
  "john.name":…,
  "john.details.description":…,
  "mark.name":…,
  "mark.details.description":…
}
```


### `rosey-array-ns`
`rosey-array-ns` is used when you have an array where the value needs to be translated. The value of the element defined as `rose-array-ns` will be used as part of the tag name.

With given example

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

We can have the following schema file:
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

The output translation keys generated are:
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
## Synopsis

```
$ rosey <command> [args]
```


## Usage


### Help
##### ```help```
Present the list of available commands

#### Example:

```
$ rosey help
```

### Generate
##### ```generate```
Generates a lookup table, called a “locale”, for these keys. The locale determines the content to be shown for each `data-rosey` key.
The generated locale source is saved by default at `rosey/source.json`.

#### Example:

```
$ rosey generate [<source>|<version>|<tag>|<locale-dest>|<source-delimiter>]
```

### Check
##### ```check```
Generates a comparison of `rosey/source.json` and `rosey/locales/*.json` at `rosey/checks.json`. This is not run as part of the `rosey` command.

#### Example:

```
$ rosey check [<version>|<locale-source>|<locale-dest>]
```

### Convert
##### ```convert```
If you still have `locales` files using version 1, you can use the `convert` command to migrate the current translations to version 2.
It will need an existing `source.json` file on with version 2 file as the base for the new locales files. 
It is recommended to run `rosey generate --version 2` before using the `convert` command.

#### Example:

```
$ rosey convert [<locale-source>|<locale-dest>]
```

### Rosey
##### ```rosey```
Create translated version of your website for each "locale" file on the `rosey/locales/` folder. 
Serves the translated version on a local browser and watches for changes.

#### Example:

```
$ rosey [<source>|<dest>|<credentials>|<yes>|<version>|<port>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```

### Build
##### ```build```
Builds the translated sites to the `dest` folder.

#### Example:

```
$ rosey build [<source>|<dest>|<credentials>|<yes>|<tag>|<locale-source>|<default-language>]
```

##### Japanese translations
When translating for a Japanese website the translated content from the locales folder will have span tags added to wordwrap characters more appropriately. 
This requires a [Google Cloud Natural Language API key](https://cloud.google.com/natural-language/docs/quickstart) to be set.
You can either use a argument when calling the CLI command, or set the specific environment variable.

#### Example:

```
$ rosey build --credentials /PATH/TO/CREDENTIALS/google-creds.json
```
or
```
$ export GOOGLE_APPLICATION_CREDENTIALS='/PATH/TO/CREDENTIALS/credentials.json'
```

### Serve
##### ```serve```
Runs a local webserver on the `dest` folder.

#### Example:

```
$ rosey serve [<dest>|<port>]
```

### Watch
##### ```watch```
Watches the `source` and `locale_source` folders.
A ``build`` is triggered when the `source` files are modified.
A ``generate`` is triggered when the `locale_source` files are modified.

#### Example:

```
$ rosey watch [<source>|<credentials>|<yes>|<version>|<tag>|<locale-source>|<locale-dest>|<default-language>|<source-delimiter>]
```


### Clean
##### ```clean```

Deletes the contents of the `dest` folder.

#### Example:

```
$ rosey clean [<dest>|<yes>]
```

### Base
##### ```base```

Copy assets and creates the redirect page into the `dest` folder. Use `translate` to generate the translated websites.

#### Example:

```
$ rosey base [<source>|<dest>|<tag>|<locale-source>|<default-language>]
```


### Translate
##### ```translate```

Generates a translated version of the websites on `dest` for the specified languages only.

#### Example:

```
$ rosey translate [<source>|<dest>|<languages>|<credentials>|<tag>|<locale-source>]
```

#### Required flags:
[-l | --languages ]