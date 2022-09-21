---
title: "Translating Elements"
nav_title: "Translating Elements"
nav_section: Tagging
weight: 3
---

Elements to be translated need to have the `data-rosey` attribute. For example:

```html
<!DOCTYPE html>
<html>
    <body>
        <h1 data-rosey="title">Home page title</h1>
        <h2 data-rosey="sub-title">Home page subtitle</h2>
    </body>
</html>
```

Will produce the translation keys:

| Key         | Original           |
|-------------|--------------------|
| `title`     | Home page title    |
| `sub-title` | Home page subtitle |

## Translating Inner HTML

The `data-rosey` tag can be applied to elements containing HTML, which will be captured for translation. For example:

```html
<!DOCTYPE html>
<html>
    <body>
        <h1 data-rosey="title">Home page title</h1>
        <article data-rosey="content">
            <img src="/image.png"/>
            <p>Some content</p>
        </article>
    </body>
</html>
```

Will produce the translation keys:

| Key       | Original                                       |
|-----------|------------------------------------------------|
| `title`   | Home page title                                |
| `content` | `<img src="/image.png"/>\n<p>Some content</p>` |

> If integrating with a translation provider, that provider will need to translate HTML strings correctly.


