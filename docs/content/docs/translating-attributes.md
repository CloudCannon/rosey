---
title: "Translating Attributes"
nav_title: "Translating Attributes"
nav_section: Tagging
weight: 5
---

Rosey offers a workflow to translate content in HTML attributes, beyond only the HTML element content.

## Tagging attributes

Use the `data-rosey-attrs` attribute to translate HTML attributes on an element that already has a `data-rosey` tag. Multiple attributes can be translated by comma separation:

{{< diffcode >}}
```html
<!DOCTYPE html>
<html>
    <body>
        <h1 content="content text"
            alt="alt text"
            data-rosey="title"
+            data-rosey-attrs="content,alt"
        >Hello!</h1>
    </body>
</html>
```
{{< /diffcode >}}

The name of the attribute will be appended to the `data-rosey` key with a period, thus the above example will produce the output translation keys:

```json
{
  "title":"Hello!",
  "title.content":"content text",
  "title.alt":"alt text",
}
```

## Explicitly tagging attributes

If you want to define a custom translation key, or want to tag an attribute on an element that is otherwise not translated, use the `data-rosey-attrs-explicit` attribute. This expects a JSON object of `<attribute>: <translation key>` pairs:

{{< diffcode >}}
```html
<!DOCTYPE html>
<html>
    <body>
        <img src="/img.png"
             content="My content text"
             alt="My alt text"
+             data-rosey-attrs-explicit='{"content":"content","alt":"alternative-text"}'
            />
        <h1 data-rosey="title">Hello!</h1>
    </body>
</html>
```
{{< /diffcode >}}

The above example will produce the output translation keys:

```json
{
  "content":"My content text",
  "alternative-text":"My alt text",
  "title":"Hello!",
}
```