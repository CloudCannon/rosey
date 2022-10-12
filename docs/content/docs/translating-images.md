---
title: "Translating Images"
nav_title: "Translating Images"
nav_section: Tagging
weight: 6
---

Rosey can replace images within blocks of translated HTML using translated images, using a filename convention.

When Rosey encounters an asset inside a block of translated HTML, it will check for a language-specific image alongside the original, and rewrite the URL if one is found. For a given `image.png`, Rosey will check for an `image.<language>.png` file to use in its place.

First, an element wrapping the image must be tagged with a `data-rosey` attribute:

{{< diffcode >}}
```html
+<div data-rosey="content">
    <p>Hello!</p>
    <img src='/assets/hello.png' />
</div>
```
{{< /diffcode >}}

Producing the `source.json` file:

```json
{
    "version": 2,
    "keys": {
        "content": {
            "original": "<p>Hello!</p>\n<img src='/assets/hello.png' />",
            "pages": {
                "index.html": 1
            },
            "total": 1
        }
    }
}
```

When translating this file into your given locale, the image URL does not need to be altered. After translating your keys into a `rosey/locales/fr.json` file, you should have something along the lines of:

```json
{
    "content": {
        "original": "<p>Hello!</p>\n<img src='/assets/hello.png' />",
    	"value": "<p>Bonjour!</p>\n<img src='/assets/hello.png' />"
    }
}
```

Now before building your multilingual site with Rosey, add an asset matching the language code alongside the original asset:

{{< tree >}}
_site
>> assets
   >> hello.png
+   >> hello.fr.png
{{< /tree >}}

Now after running `rosey build`, you should see the following final output on a `fr` page:

```html
<div data-rosey="content">
    <p>Bonjour!</p>
    <img src='/assets/hello.fr.png' />
</div>
```