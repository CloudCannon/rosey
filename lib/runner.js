const async = require('async');
const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const chokidar = require('chokidar');
const del = require('del');
const fs = require('fs-extra');
const log = require('fancy-log');
const path = require('path');
const readlineSync = require('readline-sync');
const rename = require('gulp-rename');
const vfs = require('vinyl-fs');

const i18n = require('./plugins/i18n');
const wordwrap = require('./plugins/wordwrap-json');

const regex = {
  html: /\.html?$/,
};

let locales; let
  localeNames; // holds locales between stages

// TODO: Refactor method
function readLocalesFromDir(dir, done) {
  const returnedLocales = {};
  fs.readdir(dir, (errReadDir, files) => {
    if (errReadDir) {
      return done(errReadDir);
    }

    async.each(files, (filename, next) => {
      if (!/\.json$/.test(filename)) {
        return next();
      }

      fs.readFile(path.join(dir, filename), (errReadFile, data) => {
        if (errReadFile) {
          log(errReadFile);
          return next(errReadFile);
        }

        const key = filename.replace(/\.json$/, '');
        try {
          returnedLocales[key] = JSON.parse(data);
        } catch (errParseJson) {
          log(`${c.red('Malformed JSON')} from ${
            c.blue(`${dir}/${filename}`)}: ${errParseJson.message}`);
        }

        const returnedObj = returnedLocales[key];
        if (typeof (returnedObj) !== 'undefined') {
          Object.keys(returnedObj).forEach((localeKey) => {
            if (Object.prototype.hasOwnProperty.call(returnedObj, localeKey)) {
              returnedObj[localeKey] = {
                translation: returnedObj[localeKey],
                count: 0,
              };
            }
          });
        }
        return next();
      });
    }, (err) => {
      done(err, returnedLocales);
    });
  });
}

/**
*  Load the JSON files form the locale folder and save into global variables
*
* @param {Object} options The options object.
*/
function loadLocales(options) {
  return new Promise((resolve, reject) => {
    readLocalesFromDir(options.i18n.full_locale_source, (err, returnedLocales) => {
      if (!err) {
        locales = returnedLocales;
        locales[options.i18n.default_language] = null;
        localeNames = Object.keys(locales).sort();
        return resolve();
      }
      log(`${c.red('Unable to read locales')} from ${
        c.blue(options.i18n.full_locale_source)}: ${err.message}`);
      log(c.yellow('You must create the locales files on the `i18n/locales/` folder before building the website.'));
      return reject(err);
    });
  });
}

/**
 * Copy all files expect .HTML ones from source to dest
 *
 * @param {Object} options The options object.
 */
function cloneAssets(options) {
  const filterFunc = (source) => !regex.html.test(source);// it will be copied if return true

  async function copyAssets() {
    try {
      return await fs.copy(options.i18n.full_source, options.i18n.full_dest,
        { filter: filterFunc });
    } catch (err) {
      return err;
    }
  }

  log('Starting clonning assets.');
  return copyAssets(options);
}

/**
 * Translate all HTML pages based on the locales file.
 *
 * @param {Object} options The options object.
 */
function translateHtmlPages(options) {
  log('Starting translating pages.');
  return async.each(localeNames, (targetLocale, next) => {
    vfs.src(`${options.i18n.source}/**/*.html`)
      .pipe(i18n.translate({
        showSkippedUpdates: options.i18n.show_skipped_updates,
        showMissingLocaleWarnings: options.i18n.show_missing_locale_warnings,
        addOtherLocaleAlternates: true,
        targetLocale,
        localeNames,
        locales,
      }))
      .pipe(rename((parsedPath) => {
        parsedPath.dirname = parsedPath.dirname.replace(/^\/+/, '') || '.';
      }))
      .pipe(vfs.dest(path.join(options.i18n.dest, targetLocale)))
      .on('end', next);
  });
}

/**
 * Copy the PreLocalized HTML pages and update internal links
 *
 * @param {Object} options The options object.
 */
function clonePrelocalisedHtmlPages(options) {
  log('Starting clonning prelocalised pages.');
  return async.each(localeNames, (targetLocale, next) => {
    vfs.src(`${options.i18n.source}/${targetLocale}/**/*.html`)
      .pipe(i18n.translate({
        showSkippedUpdates: options.i18n.show_skipped_updates,
        showMissingLocaleWarnings: options.i18n.show_missing_locale_warnings,
        addOtherLocaleAlternates: false,
        targetLocale,
        localeNames,
        locales,
      }))
      .pipe(vfs.dest(path.join(options.i18n.dest, targetLocale)))
      .on('end', next);
  });
}

/**
 * Generates the Reditect HTML Page
 *
 * @param {Object} options The options object.
 */
function generateRedirectHtmlPages(options) {
  log('Starting generating the Redirect HTML page.');

  return new Promise((resolve) => {
    vfs.src(`${options.i18n.source}/**/*.html`)
      .pipe(i18n.redirectPage({
        defaultLocale: options.i18n.default_language,
        localeNames,
        locales,
      })).pipe(vfs.dest(options.i18n.dest));
    resolve();
  });
}


function wordwrapLocale(targetLocale, jsonString, done) {
  const output = {};
  const locale = JSON.parse(jsonString);
  const keys = Object.keys(locale);
  async.eachLimit(keys, 50, (key, next) => {
    const translation = locale[key];
    if (translation.includes('</') || key.includes('meta:')) {
      output[key] = translation;

      return setImmediate(next);
    }


    wordwrap.parse({
      text: translation,
      language: targetLocale,
      attributes: { class: 'wordwrap' },
    }, (err, parsed) => {
      if (parsed) {
        output[key] = parsed.replace(/\n/g, ' ').replace(/\r/g, '');
      }
      next(err);
    });
  }, (err) => {
    const sortedOutput = {};
    Object.keys(output).sort().forEach((key) => {
      sortedOutput[key] = output[key];
    });
    done(err, err ? null : JSON.stringify(sortedOutput, null, '\t'));
  });
}

/**
 * @param {Object} options The options object.
 */
async function wrapCharacters(options) {
  // Change this to a cli flag?
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    log('Environment variable GOOGLE_APPLICATION_CREDENTIALS not found');
    log('export GOOGLE_APPLICATION_CREDENTIALS="/PATH/TO/CREDENTIALS/google-creds.json"');
    return Promise.reject;
  }

  const wrappedDir = path.join(options.i18n.locale_source, '../wrapped');

  await fs.ensureDir(wrappedDir).then(() => async.eachSeries(localeNames, (targetLocale, next) => {
    if (options.i18n.character_based_locales.indexOf(targetLocale) < 0) {
      return next();
    }

    if (!wordwrap.isLanguageSupported(targetLocale)) {
      log(`${targetLocale} is not supported`);
      return next();
    }

    const inputFilename = path.join(options.i18n.locale_source, `${targetLocale}.json`);
    const outputFilename = path.join(wrappedDir, `${targetLocale}.json`);

    fs.readFile(inputFilename, (errReadFile, data) => {
      log(`Processing character wrapping for: ${targetLocale}`);
      if (errReadFile) {
        log(errReadFile);
        return next;
      }

      wordwrapLocale(targetLocale, data.toString('utf8'), (errWordWrap, output) => {
        if (errWordWrap) {
          log(`${targetLocale}: failed to wrap`, errWordWrap);
          return next(errWordWrap);
        }

        fs.writeFile(outputFilename, output, (errWriteFile) => {
          if (errWriteFile) {
            log(`${targetLocale}: failed to wrap`, errWriteFile);
            return next(errWriteFile);
          }

          return next();
        });
      });
    });
  }));
  return Promise.resolve;
}

function loadWordwraps(options) {
  return new Promise((resolve) => {
    const wrappedDir = path.join(options.i18n.locale_source, '../wrapped');
    readLocalesFromDir(wrappedDir, (err, returnedLocales) => {
      if (!err) {
        Object.keys(returnedLocales).forEach((localeName) => {
          if (Object.prototype.hasOwnProperty.call(returnedLocales, localeName)) {
            log(`${localeName} loaded from wrapped`);
            locales[localeName] = returnedLocales[localeName];
          }
        });
      } else {
        log(c.yellow('Wrapped files not found: ') + c.red(err.message));
      }
      resolve(err);
    });
  });
}

module.exports = {

  /**
     * Queries the user for a yes/no response.
     *
     * @param {String} question The question to ask the user.
     * @returns {Boolean} True on a yes response, false otherwise.
     */
  askYesNo(question, responseOverride = false) {
    const response = responseOverride || readlineSync.question(c.green(question));

    if (!(response === 'Y' || response === 'y')) {
      log(c.red('Process cancelled by user. exiting...'));
      return false;
    }
    return true;
  },

  /**
     * Display the help message.
     *
     * @param {Object} options The options object.
     */
  help(options) {
    log(options.help);
    return 0;
  },

  /**
     * Generates a lookup table, called a “locale”, for these keys.
     * The locale determines the content to be shown for each data-i18n key.
     * This generated locale is saved at i18n/source.json.
     *
     * @param {Object} options The options object.
     */
  generate(options) {
    log(`${c.green('Generating source locale')} from ${
      c.blue(options.i18n.full_source)
    } to ${
      c.blue(options.i18n.full_generated_locale_dest)}`);

    return new Promise((resolve) => {
      vfs.src(`${options.i18n.full_source}/**/*.html`)
        .pipe(i18n.generate({
          version: options.i18n.source_version,
          delimeter: options.i18n.source_delimeter,
          showDuplicateLocaleWarnings: options.i18n.show_duplicate_locale_warnings,
        }))
        .pipe(vfs.dest(options.i18n.full_generated_locale_dest))
        .on('end', resolve);
    });
  },


  /**
     * Generates a comparison of i18n/source.json and i18n/locales/*.json at i18n/checks.json.
     * This is not run as part of the i18n command.
     *
     * @param {Object} options The options object.
     */
  check(options) {
    return new Promise((resolve, reject) => {
      readLocalesFromDir(options.i18n.locale_source, (errReadLocales, returnedLocales) => {
        if (errReadLocales) {
          log(`${c.red('Unable to read locales')} from ${
            c.blue(options.i18n.locale_source)}: ${errReadLocales.message}`);
          return reject(errReadLocales);
        }

        log(`Loading ${path.join(options.i18n.generated_locale_dest, 'source.json')}...`);
        fs.readFile(path.join(options.i18n.generated_locale_dest, 'source.json'), (errReadFile, data) => {
          if (errReadFile) {
            log(`${c.red('Unable to read source')} from ${
              c.blue(path.join(options.i18n.generated_locale_dest, 'source.json'))}: ${errReadFile.message}`);
            log(c.yellow('You must execute `i18n generate` before using the `check` command'));
            return reject(errReadFile);
          }

          const source = JSON.parse(data);
          let sourceLookup;

          if (source.version) {
            sourceLookup = source.keys;
          } else {
            sourceLookup = source;
          }

          const sourceKeys = Object.keys(sourceLookup);
          const output = {};
          const localeCodes = Object.keys(returnedLocales).sort();

          function compareTranslations(sourceT, target) {
            if (!target) {
              return 'missing';
            }
            if (options.i18n.source_version > 1) {
              const sourceString = sourceT.original;
              const targetString = target.translation.original;

              return sourceString === targetString ? 'current' : 'outdated';
            }
            return 'current';
          }

          for (let i = 0; i < localeCodes.length; i += 1) {
            const localeCode = localeCodes[i];
            const translations = returnedLocales[localeCode];
            output[localeCode] = {
              current: true,
              sourceTotal: sourceKeys.length,
              total: Object.keys(translations).length,
              states: {
                missing: 0,
                current: 0,
                outdated: 0,
                unused: 0,
              },
              keys: {},
            };

            for (let j = 0; j < sourceKeys.length; j += 1) {
              const sourceKey = sourceKeys[j];
              const sourceTranslation = sourceLookup[sourceKey];
              const targetTranslation = translations[sourceKey];

              const state = compareTranslations(sourceTranslation, targetTranslation);
              output[localeCode].current = output[localeCode].current && state === 'current';
              output[localeCode].states[state] += 1;
              output[localeCode].keys[sourceKey] = state;
              delete translations[sourceKey];
            }

            const extraKeys = Object.keys(translations);
            for (let x = 0; x < extraKeys.length; x += 1) {
              const extraKey = extraKeys[x];
              output[localeCode].current = false;
              output[localeCode].keys[extraKey] = 'unused';
              output[localeCode].states.unused += 1;
            }

            if (output[localeCode].current) {
              log(c.green(`✅  '${localeCode}' is all up to date`));
            } else {
              const logMessages = [];

              if (output[localeCode].states.missing) {
                logMessages.push(`${output[localeCode].states.missing} missing`);
              }

              if (output[localeCode].states.outdated) {
                logMessages.push(`${output[localeCode].states.outdated} outdated`);
              }

              if (output[localeCode].states.unused) {
                logMessages.push(`${output[localeCode].states.unused} unused`);
              }

              let logMessage = `⚠️  '${localeCode}' translations include `;
              if (logMessages.length > 1) {
                logMessage += `${logMessages.slice(0, -1).join(', ')} and ${logMessages.slice(-1)}`;
              } else {
                logMessage += logMessages[0];
              }
              log(c.yellow(logMessage));
            }
          }

          const outputFilename = path.join(options.i18n.generated_locale_dest, 'checks.json');
          fs.writeFile(outputFilename, JSON.stringify(output, null, '\t'));
          log(c.green(`Checks file created on ${outputFilename}`));
          return resolve();
        });
      });
    });
  },

  /**
     * Default command (runs when no command is specified).
     * Builds, serves, and watches.
     *
     * @param {Object} options The options object.
     * @returns {number} The exit code.
     */
  async i18n(options) {
    const exit = await this.build(options);
    if (exit > 0) return exit;
    this.serve(options);
    this.watch(options);
    return 0;
  },

  /**
     * Builds the translated websites based on the locales files
     * @param {Object} options The options object.
     */
  async build(options) {
    // Load locales files
    const loadLocalesProm = loadLocales(options);

    // Clean up the dest folder
    const cleaned = await this.clean(options);
    if (typeof cleaned === 'number') {
      log.error('Error cleaning the destination folder');
      return cleaned; // errored in clean
    }


    // Wait for locales to be loaded
    await loadLocalesProm;

    // Call to wrap words for some languages
    await wrapCharacters(options);

    // Update locales for languages that
    await loadWordwraps(options);

    const cloneAssetsProm = cloneAssets(options).then(() => { log('Finished clonning assets.'); });

    const translateHtmlPagesProm = translateHtmlPages(options).then(() => { log('Finished translating pages.'); });

    const clonePrelocalisedHtmlPagesProm = clonePrelocalisedHtmlPages(options).then(() => { log('Finished clonning prelocalised pages.'); });


    await cloneAssetsProm;
    await translateHtmlPagesProm;
    await clonePrelocalisedHtmlPagesProm;

    const generateRedirectHtmlPagesProm = generateRedirectHtmlPages(options).then(() => { log('Finished generating the Redirect HTML page.'); });
    await generateRedirectHtmlPagesProm;

    return 0;
  },

  /**
     * Deletes dest and all files contained in dest.
     * @param {Object} options The options object.
     */
  async clean(options) {
    if (fs.pathExistsSync(options.i18n.dest)) {
      const question = `Warning: The destination ${options.i18n.dest} already exists.`
            + ' Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): ';
      const isYes = !options.flags.yes ? this.askYesNo(question) : options.flags.yes;
      if (!isYes) return 1;
    }
    log(`Cleaning ${options.i18n.dest}`);
    return del(options.i18n.dest);
  },

  /**
     * Serves the translated websites based on a local browser
     * @param {Object} options The options object.
     */
  async serve(options) {
    browserSync.init({
      server: {
        baseDir: options.i18n.dest,
      },
      port: options.serve.port,
    });
  },

  /**
     * Continuously watches the dest folder to check for changes. If a change
     * occurs, then the browswer that is viewing the local webserver will be reloaded, so
     * that the new content can be viewed. Because this process runs continously, it does
     * not return an exit code and must be cancelled by the user in-terminal.
     *
     * @param {Object} options The options object.
     */
  watch(options) {
    // log("watching folders..."+options.i18n.locale_source);
    const watchOptions = {
      awaitWriteFinish: {
        stabilityThreshold: 1000,
      },
    };
    chokidar.watch(`${options.i18n.locale_source}/*.json`, watchOptions).on('change', (event, pathLocales) => {
      log(`${pathLocales} has been modified (${event}). Reloading...`);
      this.reload(options);
    });


    chokidar.watch(`${options.i18n.source}/**/*`, watchOptions).on('change', (event, pathSource) => {
      log(`${pathSource} has been modified (${event}). Reloading...`);
      this.reload(options);
      this.generate(options);
    });
  },
  /**
     * Rebuild the translated website and refresh the browser
     *
     * @param {Object} options The options object.
     */
  async reload(options) {
    const exit = await this.build(options);
    if (exit > 0) return exit;
    this.reloadBrowser();
    return exit;
  },
  /**
     * Rebuild the translated website and refresh the browser
     *
     * @param {Object} options The options object.
     */
  reloadBrowser() {
    browserSync.reload();
  },

};
