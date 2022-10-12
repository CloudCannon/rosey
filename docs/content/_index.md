---
title: Rosey
nav_title: Home
weight: 1
---

Rosey is an open-source tool for managing translations on static websites. Rosey aims to decouple your static site generator from your translation workflow, simplifying development of multilingual components and layouts.

Rosey runs after Hugo, Eleventy, Jekyll, or **any other tool that generates fully static sites**, merging your original site and your translations into one multilingual website. The installation process is always the same; Rosey is a standalone binary rather than a framework-specific plugin.

The Rosey workflow involves tagging your HTML elements with the information needed to translate them. After your site builds in its primary language, Rosey ingests your final site and extracts tagged elements for translation. Once these have been translated, Rosey combines your original site with each set of translated content, resulting in a final multilingual website. This differs to many translation workflows that bake multilingual support into the templating, and provides many benefits:
- Components can be developed in isolation, without needing access to data files or framework-specific translation logic
- Layouts and components can translate hard-coded text without having to abstract it into data files or front matter
- Translations can be shared across websites and static site generators
- Only one copy of your source content needs to be maintained

To get started with Rosey, make sure you have a fully static site (e.g. a Hugo, Eleventy, or Astro site without client-side Javascript) and check out the [Getting Started documentation](/docs/).