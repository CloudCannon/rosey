const Vinyl = require('vinyl');
const PluginError = require('plugin-error');
const fs = require('fs');
const c = require('ansi-colors');
const through = require('through2').obj;
const sortObject = require('sort-object-keys');
const log = require('fancy-log');
const cheerio = require('cheerio');
const crypto = require('crypto');
const path = require('path');

const REDIRECT_HTML = fs.readFileSync(`${__dirname}/redirect-page.html`, 'utf8');
const IGNORE_URL_REGEX = /^([a-z]+\:|\/\/|\#)/;

function cleanObj(obj) {
  for (const prop in obj) {
    if (!obj[prop]) {
      delete obj[prop];
    }
  }
}

function getBaseFolder(sitePath) {
  return sitePath.replace(/^\/+/, '').split(path.sep).shift();
}

function generateDefaultI18nKey($, $el) {
  const outerHTML = $.html($el);
  return crypto.createHash('sha256').update(outerHTML).digest('base64').replace(/=+$/, '');
}


function handleHTMLFile(options) {
  options = options || {};
  return through(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      return callback(new PluginError('local-ejs', 'Streaming not supported'));
    }

    file.sitePath = `/${file.path.substring(file.base.length)}`;
    file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

    if (options.skipFile && options.skipFile(file)) {
      return callback();
    }

    const $ = cheerio.load(file.contents.toString(encoding), { _useHtmlParser2: true, lowerCaseAttributeNames: false, decodeEntities: false });

    $('[data-i18n]').each(function processElement() {
      const $el = $(this);
      let key = $el.attr('data-i18n');
      let attributes = $el.attr('data-i18n-attrs');

      if (!key) {
        key = generateDefaultI18nKey($, $el);
      }

      attributes = attributes ? attributes.split(',') : [];
      attributes.map((attr) => attr.trim());

      options.processElement.apply(this, [file, $el, key, attributes, $]);
    });

    if (options.rewriteLinks) {
      $('a[href]:not([preserve-link]), link[href]:not([preserve-link])').each(function processLink() {
        const $el = $(this);
        const href = $el.attr('href');
        const updated = href && options.rewriteLinks.apply(this, [file, href]);

        if (updated) {
          $el.attr('href', updated);
        }
      });
      $("meta[http-equiv='refresh']").each(function processLink() {
        const $el = $(this);
        const content = $el.attr('content');
        const parts = content.split(';');

        for (let i = 0; i < parts.length; i++) {
          if (parts[i].toLowerCase().indexOf('url=') === 0) {
            const href = parts[i].substring(4);
            const updated = options.rewriteLinks.apply(this, [file, href]);

            if (updated) {
              parts[i] = `url=${updated}`;
              $el.attr('content', parts.join(';'));
            }
            return;
          }
        }
      });
    }

    if (options.completeFile) {
      options.completeFile.apply(this, [file, $]);
    }

    callback();
  }, options.complete);
}

module.exports = {
  generate(options) {
    options = options || { version: 2 };
    const locale = {};

    function addLocale(key, value, file) {
      if (!locale[key]) {
        locale[key] = {
          original: value,
          pages: {},
          total: 0,
        };
      } else if (locale[key].original !== value && options.showDuplicateLocaleWarnings) {
        log(`${c.yellow('Duplicate & mismatched data-i18n')} ${c.grey(key)}`);
      }

      const filePath = file.path.substring(file.base.length);
      if (!locale[key].pages[filePath]) {
        locale[key].pages[filePath] = 1;
      } else {
        locale[key].pages[filePath]++;
      }

      locale[key].total++;
    }

    return handleHTMLFile({
      processElement(file, $el, key, attributes) {
        addLocale(key, $el.html(), file);
        attributes.forEach((attr) => {
          addLocale(`${key}.${attr}`, $el.attr(attr) || '', file);
        });
      },
      complete(callback) {
        const sorted = sortObject(locale);
        cleanObj(sorted);
        const keys = Object.keys(sorted);

        let contents;
        switch (options.version) {
          case 2:
            contents = {
              version: 2,
              keys: sorted,
            };
            break;
          default:
            log(c.yellow('Using legacy format, please use 2 for i18n.source_version'));
            contents = {};

            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              contents[key] = sorted[key].original;
            }
        }

        this.push(new Vinyl({
          path: 'source.json',
          contents: Buffer.from(JSON.stringify(contents, null, options.delimeter || '')),
        }));

        log(`${c.green('Generation complete')} ${
					 c.blue('i18n/source.json')
					 } available with ${keys.length} keys`);

        callback();
      },
    });
  },


  translate(options) {
    options = options || {};
    log('translating');
    const { targetLocale } = options;
    const locale = options.locales[targetLocale];
    const { localeNames } = options;

    const localeLookup = {};
    for (let i = 0; i < localeNames.length; i++) {
      localeLookup[localeNames[i]] = true;
    }

    return handleHTMLFile({
      skipFile(file) {
        const baseFolder = getBaseFolder(file.sitePath);
        const skip = !!localeLookup[baseFolder];
        if (skip && options.showSkippedUpdates) {
          log(`Skipping HTML ${c.grey(`'${file.sitePath}'`)}`);
        }
        return skip;
      },
      rewriteLinks: function rewriteLinks(file, href) {
        if (!href || IGNORE_URL_REGEX.test(href)) {
          return;
        }

        const baseFolder = getBaseFolder(href);
        if (localeLookup[baseFolder]) {
          if (options.showSkippedUpdates) {
            log(`Skipping link ${c.grey(`'${href}'`)}`);
          }
          return;
        }

        const parsed = path.parse(href);

        if (parsed.ext && parsed.ext.indexOf('.htm') !== 0) {
          return;
        }

        const parts = href.replace(/^\/+/, '').split('/');
        parts.unshift(targetLocale);

        const updated = `/${parts.join('/')}`;
        return updated.replace(/\/+/g, '/');
      },
      processElement(file, $el, key, attributes) {
        if (!locale) {
          return; // Default locale case
        }

        if (locale[key]) {
          let { translation } = locale[key];
          if (typeof locale[key].translation === 'object') {
            // Version 2
            translation = locale[key].translation.value;
          }
          $el.html(locale[key].wrappedTranslation || translation);
          locale[key].count++;
        } else if ($el.html() && options.showMissingLocaleWarnings) {
          log(`${c.yellow('Missing translation')} ${
						 c.grey(targetLocale + file.sitePath)
          } [data-i18n=${key}]`);
        }

        attributes.forEach((attr) => {
          if (locale[`${key}.${attr}`]) {
            let { translation } = locale[`${key}.${attr}`];
            if (typeof locale[`${key}.${attr}`].translation === 'object') {
              // Version 2
              translation = locale[`${key}.${attr}`].translation.value;
            }
            $el.attr(attr, translation);
            locale[`${key}.${attr}`].count++;
          } else if ($el.attr(attr) && options.showMissingLocaleWarnings) {
            log(`${c.yellow('Missing translation')} ${
							 c.grey(targetLocale + file.sitePath)
            } [data-i18n=${key}][${attr}]`);
          }
        });
      },
      completeFile(file, $) {
        $('html').attr('lang', targetLocale);
        $("meta[http-equiv='content-language']").remove();
        $('head').append(`<meta http-equiv="content-language" content="${targetLocale}">\n`);

        if (options.addOtherLocaleAlternates) {
          localeNames.forEach((localeName) => {
            if (localeName != targetLocale) {
              const redirectUrl = localeName + file.sitePath;
              $('head').append(`<link rel="alternate" href="/${redirectUrl}" hreflang="${localeName}">\n`);
            }
          });
        }

        file.contents = Buffer.from($.html());
        this.push(file);
      },
    });
  },

  redirectPage(options) {
    options = options || {};

    const { defaultLocale } = options;
    const { localeNames } = options;

    const localeLookup = {};
    for (let i = 0; i < localeNames.length; i++) {
      localeLookup[localeNames[i]] = true;
    }

    const redirectLookup = {};

    localeNames.forEach((localeName) => {
      const match = localeName.toLowerCase().match(/[a-z]+/gi);
      const language = match[0]; const
        country = match[1];

      redirectLookup[language] = localeName;
      if (country) {
        redirectLookup[`${language}-${country}`] = localeName;
        redirectLookup[`${language}_${country}`] = localeName;
      }

      redirectLookup[localeName] = localeName;
    });

    return through(function (file, encoding, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isStream()) {
        return callback(new PluginError('local-ejs', 'Streaming not supported'));
      }

      file.sitePath = `/${file.path.substring(file.base.length)}`;
      file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

      const baseFolder = getBaseFolder(file.sitePath);
      if (file.sitePath === '/404.html' || localeLookup[baseFolder]) {
        return callback();
      }

      const html = REDIRECT_HTML
        .replace(/ALTERNATES/g, localeNames.map((targetLocale) => {
          if (targetLocale !== defaultLocale) {
            return `<link rel="alternate" href="/${targetLocale}${file.sitePath}" hreflang="${targetLocale}">`;
          }
          return '';
        }).join(''))
        .replace(/SITE_PATH/g, file.sitePath)
        .replace(/DEFAULT_LANGUAGE/g, defaultLocale)
        .replace(/LOCALE_LOOKUP/g, JSON.stringify(redirectLookup));

      file.contents = Buffer.from(html);
      this.push(file);
      callback();
    });
  },
};
