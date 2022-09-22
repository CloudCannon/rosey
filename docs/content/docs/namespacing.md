---
title: "Namespacing"
nav_title: "Namespacing"
nav_section: Tagging
weight: 4
---

Rosey supports hierarchical namespacing, allowing you to build up translation key names based on the page or elements that a tag is placed within. This is particularly useful when building components, as your component may be tagged with generic key names that are combined with the namespace in which that component is used.

## Defining a namespace

Use the `data-rosey-ns` attribute to define namespaces to be included as part of the key for the translations. All parents of an element with a `data-rosey-ns` attribute will contribute to the final key, with each namespace concatenated by a colon.

{{< diffcode >}}
```html
<!DOCTYPE html>
<html>
  <head>
    <title data-rosey="title">Home title</title>
  </head>
+  <body data-rosey-ns='home'>
    <h1 data-rosey="title">Home page title</h1>
+    <div data-rosey-ns="contact-info">
      <h2 data-rosey="title">Contact us</h2>
    </div>
  </body>
</html>
```
{{< /diffcode >}}

In the above example, all text is tagged as `data-rosey="title"`. Due to the namespace attributes provided, these are de-conflicted and the output translation keys will be:

```json
{
  "title": "Home title",
  "home:title": "Home page title",
  "home:contact-info:title": "Contact us"
}
```

## Defining a namespace root

Use the `data-rosey-root` attribute to start a new namespace for all child elements.

In this example we set a root namespace separately for our head and body elements, and unset the namespace within an inner div:

{{< diffcode >}}
```html
<!DOCTYPE html>
<html>
+  <head data-rosey-root="meta">
    <title data-rosey="title">Home title</title>
  </head>
+  <body data-rosey-root="content">
    <h1 data-rosey="title">Home page title</h1>
+    <div data-rosey-root="">
      <p data-rosey="contact-us">...</p>
    </div>
  </body>
</html>
```
{{< /diffcode >}}

Output translation keys:

```json
{
    "meta:title": "Home title",
    "content:title": "Home page title",
    "contact-us": "..."
}
```

The `data-rosey-ns` attributes may be nested within a `data-rosey-root` attribute:

```html
<!DOCTYPE html>
<html>
  <body data-rosey-root="content">
    <div data-rosey-ns="contact">
      <p data-rosey="contact-us">...</p>
    </div>
  </body>
</html>
```

Output translation keys:

```json
{
    "content:contact:contact-us": "..."
}
```