---
title: "Getting Started"
nav_title: "Getting Started"
nav_section: Root
weight: 2
---

The majority of Rosey configuration happens in your static HTML, which is read and transformed by Rosey. In most places, configuration values are in the form of `data-rosey*` attributes placed on your elements.

## Tagging your first layout

For this guide we'll work through a single example: translating the page title on the homepage of an Eleventy site. The concepts apply to any static site generator, so adjust the files you're editing to match your workflow.

Our simple site has a single index page, which is configured to use a `home` layout. In our home layout, we'll tag each instance of our title with a `data-rosey` attribute.

{{< diffcode >}}
```html
---
# _includes/layouts/home.liquid
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
+    <title data-rosey="title">{{ title }}</title>
  </head>
  <body>
+    <h1 data-rosey="title">{{ title }}</h1>
    <section>
        {{ content }}
    <section>
  </body>
</html>
```
{{< /diffcode >}}

The `data-rosey` attribute expects to be passed a key for the given translation. In this case, both of these elements contain the same text, so we can share the `title` translation key.

After building our site to a static directory, our homepage file might look like the following:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-rosey="title">My Website</title>
  </head>
  <body>
    <h1 data-rosey="title">My Website</h1>
    <section>
        <p>Hello World!</p>
    <section>
  </body>
</html>
```

With our built static site on hand, we can now start running Rosey. The easiest way to run Rosey is through the npx wrapper, which the following commands will use.

## Generating the source translation file

Rosey's `generate` command is our starting point, which will generate our base translation file. For our simple Eleventy site, we should now have the following directory structure after running our site build:

{{< tree >}}
.eleventy.js
package.json
_includes/
>> _layouts/
   >> home.liquid
+_site/
+>> index.html
index.liquid
{{< /tree >}}

With our built static files in the `_site` folder, we can run the generate command:

```bash
npx rosey generate --source _site
```

Rosey will read the static HTML and extract any elements that have been tagged for translation. We now see a new file in our project:

{{< tree >}}
.eleventy.js
package.json
_includes/
>> _layouts/
   >> home.liquid
_site/
>> index.html
index.liquid
+rosey/
+>> base.json
+>> base.urls.json
{{< /tree >}}

This `base.json` file contains all text that needs to be translated. For the layout we tagged above, this will look like the following:

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
        }
    }
}
```

For now, all we need to look at is the `original` value of our key. The other values are useful to provide better context for integrations, but otherwise aren't important.

## Creating locale files

The next step from Rosey's point of view is building a multilingual website, but in order to do so we need translated content. Rosey expects translated content to exist in the `rosey/locales` folder, so to create a localized version of your site in Korean a file should be created at `rosey/locales/ko-kr.json`:

{{< tree >}}
.eleventy.js
package.json
_includes/
>> _layouts/
   >> home.liquid
_site/
>> index.html
index.liquid
rosey/
+>> locales/
+>  >> ko-kr.json
>> base.json
{{< /tree >}}

This file should contain translation keys, each containing the original and translated text. For our `base.json` above, our `ko-kr.json` locale file will look like:

```json
{
    "title": {
        "original": "My Website",
    	  "value": "나의 웹 사이트"
    }
}
```

The `original` text here will be used to detect translations that are out of date, and the `value` text will be used to build our multilingual site.

Creating these locale files is currently out of Rosey's scope. For smaller use-cases, these files can be written by hand. For larger sites, Rosey will usually be integrated with an existing translation workflow. In most cases this will involve building some middleware that uploads the strings from your `base.json` to a translation API (e.g. Smartling), and creates `rosey/locales/*.json` files with the translated response.

## Building the multilingual site

For our running example, we'll assume we have created translated locale files for `no` and `ko-kr`:

{{< tree >}}
.eleventy.js
package.json
_includes/
>> _layouts/
   >> home.liquid
_site/
>> index.html
index.liquid
rosey/
+>> locales/
+>  >> ko-kr.json
+>  >> no.json
>> base.json
{{< /tree >}}

With these newly-created files in place, let's run the `build` subcommand:

```bash
npx rosey build --source _site
```

We will now see a new translated copy of our static site alongside our original built directory:

{{< tree >}}
.eleventy.js
package.json
_includes/
>> _layouts/
   >> home.liquid
_site/
>> index.html
+_site_translated/
+>> en/
+>  >> index.html
+>> ko-kr/
+>  >> index.html
+>> no/
+>  >> index.html
+>> index.html
index.liquid
rosey/
>> locales/
>  >> ko-kr.json
>  >> no.json
>> base.json
{{< /tree >}}

At a glance we can see that Rosey has created a subdirectory for each of our languages. Peeking inside `_site_translated/ko-kr/index.html`:

```html
<!doctype html>
<html lang="ko-kr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-rosey="title">나의 웹 사이트</title>
    <meta content="ko-kr" http-equiv="content-language">
    <link href="/no/" hreflang="no" rel="alternate">
    <link href="/en/" hreflang="en" rel="alternate">
  </head>
  <body>
    <h1 data-rosey="title">나의 웹 사이트</h1>
    <section>
        <p>Hello World!</p>
    <section>
  </body>
</html>
```

We can see that Rosey has translated the content we tagged, and has also added some SEO metadata for the current and alternate languages.

The main entry point of the website (`_site_translated/index.html`) has been replaced by a smart redirection page that takes a viewer to the language that best fits their web browser language preferences.

This new static directory is now ready to be deployed as a fully static multilingual website 🎉
