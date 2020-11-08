/* eslint-disable consistent-return */
const async = require('async');
const browserSync = require('browser-sync').create();
const c = require('ansi-colors');
const chokidar = require('chokidar');
const del = require('del');
const fs = require('fs-extra');
const log = require('fancy-log');
const path = require('path');
const readlineSync = require('readline-sync');
const vfs = require('vinyl-fs');
const sortObject = require('sort-object-keys');

const rosey = require('./plugins/rosey');
const wordwrap = require('./plugins/wordwrap-json');
const JsonGenerator = require('./plugins/json/JsonGenerator');
const HTMLGenerator = require('./plugins/html/HTMLGenerator');
const HTMLTranslator = require('./plugins/html/HTMLTranslator');

const regex = {
	html: /\.html?$/,
	json: /\.json?$/
};

// holds locales between stages
let locales;
let localeNames;
let localeNamesFiltered;

function cleanObj(obj) {
	Object.keys(obj).forEach((prop) => {
		if (!obj[prop]) {
			delete obj[prop];
		}
	});
}

// TODO: Refactor method
function readLocalesFromDir(dir, done) {
	const returnedLocales = {};
	fs.readdir(dir, (errReadDir, files) => {
		if (errReadDir) {
			log('errReadDir', c.magenta(errReadDir));
			return done(errReadDir, returnedLocales);
		}

		async.each(files, (filename, next) => {
			if (!/\.json$/.test(filename)) {
				return next();
			}

			fs.readFile(path.join(dir, filename), (errReadFile, data) => {
				if (errReadFile) {
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
								count: 0
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
		readLocalesFromDir(options.rosey.full_locale_source, (err, returnedLocales) => {
			if (!err) {
				locales = returnedLocales;
				locales[options.rosey.default_language] = null;
				localeNames = Object.keys(locales).sort();
				localeNamesFiltered = Object.keys(locales)
				// eslint-disable-next-line max-len
					.filter((key) => (options.flags.partialLanguages ? options.flags.partialLanguages.includes(key.toUpperCase()) : true))
					.sort();
				resolve();
			} else {
				log(`${c.red('Unable to read locales')} from ${
					c.blue(options.rosey.full_locale_source)}: ${err.message}`);
				log(c.yellow(`You must create the locales files on the '${options.rosey.locale_source}' folder before building the website.`));
				reject(err);
			}
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
			return await fs.copy(options.rosey.full_source, options.rosey.full_dest,
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

	return async.each(localeNamesFiltered, (targetLocale, next) => {
		const htmlTranslator = new HTMLTranslator({
			...options,
			targetLocale: targetLocale,
			localeNames: localeNames,
			locale: locales[targetLocale]
		});
		htmlTranslator.translateFiles(next);
	});
}

/**
 * Copy the PreLocalized HTML pages and update internal links
 *
 * @param {Object} options The options object.
 */
function clonePrelocalisedHtmlPages(options) {
	log('Starting clonning prelocalised pages.');
	return async.each(localeNamesFiltered, (targetLocale, next) => {
		const htmlTranslator = new HTMLTranslator({
			...options,
			targetLocale: targetLocale,
			localeNames: localeNames,
			locale: locales[targetLocale]
		});
		htmlTranslator.clonePrelocalisedHtmlPages(next);
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
		vfs.src(`${options.rosey.source}/**/*.html`)
			.pipe(rosey.redirectPage({
				defaultLocale: options.rosey.default_language,
				localeNames: localeNames,
				locales: locales,
				tag: options.rosey.data_tag
			})).pipe(vfs.dest(options.rosey.dest));
		resolve();
	});
}

function wordwrapLocale(targetLocale, jsonString, options, done) {
	const output = {};
	const locale = JSON.parse(jsonString);
	const keys = Object.keys(locale);
	let count = 0;
	async.eachLimit(keys, 50, (key, next) => {
		count += 1;

		log(`Wrapping ${count} of ${keys.length}`);
		const translation = locale[key];
		if (translation.includes('</') || key.includes('meta:')) {
			output[key] = translation;
			return setImmediate(next);
		}

		wordwrap.parse({
			text: translation,
			language: targetLocale,
			attributes: { class: 'wordwrap' },
			pathToCredentials: options.rosey.credentials
		}, (err, parsed) => {
			if (parsed) {
				output[key] = parsed.replace(/\n/g, ' ').replace(/\r/g, '');
			}
			setTimeout(() => {
				next(err);
			}, 500);
		});
	}, (err) => {
		done(err, err ? null : JSON.stringify(output, null, '\t'));
	});
}

/**
 * @param {Object} options The options object.
 */
async function wrapCharacters(options) {
	// Change this to a cli flag?
	log('Starting wrapping characters.');
	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !options.rosey.credentials) {
		log(c.yellow('Environment variable GOOGLE_APPLICATION_CREDENTIALS not found'));
		log(c.yellow('use the flag `--credentials /PATH/TO/CREDENTIALS/google-creds.json` calling the cli interface'));
		log(c.yellow('or use `export GOOGLE_APPLICATION_CREDENTIALS="/PATH/TO/CREDENTIALS/google-creds.json"`'));
		return;
	}

	const wrappedDir = path.join(options.rosey.locale_source, '../wrapped');

	await fs.ensureDir(wrappedDir)
		.then(() => async.eachSeries(localeNamesFiltered, (targetLocale, next) => {
			if (options.rosey.character_based_locales.indexOf(targetLocale) < 0) {
				return next();
			}
			const inputFilename = path.join(options.rosey.locale_source, `${targetLocale}.json`);
			const outputFilename = path.join(wrappedDir, `${targetLocale}.json`);

			fs.readFile(inputFilename, (errReadFile, data) => {
				log(`Processing character wrapping for: ${targetLocale}`);
				if (errReadFile) {
					log(errReadFile);
					return next;
				}

				wordwrapLocale(targetLocale, data.toString('utf8'), options, (errWordWrap, output) => {
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
}

function loadWordwraps(options) {
	return new Promise((resolve) => {
		const wrappedDir = path.join(options.rosey.locale_source, '../wrapped');
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

function formatSourceOutput(options, arrayLocales) {
	const complete = {};
	Object.keys(arrayLocales).forEach((i) => {
		Object.assign(complete, arrayLocales[i]);
	});

	const sorted = sortObject(complete);
	cleanObj(sorted);
	const keys = Object.keys(sorted);

	let contents;
	switch (options.rosey.source_version) {
	case 2:
		contents = {
			version: 2,
			keys: sorted
		};
		break;
	default:
		log(c.yellow('DEPRECATED: Using legacy format! Please use use `-v 2` flag'));
		contents = {};

		for (let i = 0; i < keys.length; i += 1) {
			const key = keys[i];
			contents[key] = sorted[key].original;
		}
	}
	return contents;
}

module.exports = {

	/**
     * Queries the user for a yes/no response.
     *
     * @param {String} question The question to ask the user.
     * @returns {Boolean} True on a yes response, false otherwise.
     */
	askYesNo: function (question, responseOverride = false) {
		const response = responseOverride || readlineSync.question(c.yellow(question));

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
	help: function (options) {
		log(options.help);
		return 0;
	},

	/**
     * Generates a lookup table, called a “locale”, for these keys.
     * The locale determines the content to be shown for each data-rosey key.
     * This generated locale is saved at rosey/source.json.
     *
     * @param {Object} options The options object.
     */
	generate: async function (options) {
		// return new Promise((async (resolve, reject) => {
		log(`${c.green('Generating source locale')} from ${
			c.blue(options.rosey.full_source)
		} to ${
			c.blue(options.rosey.full_generated_locale_dest)}`);

		const jsonGenerator = new JsonGenerator(options);
		const htmlGenerator = new HTMLGenerator(options);
		await Promise.all([htmlGenerator.readFiles(), jsonGenerator.readFiles()]);

		const contents = formatSourceOutput(options, [htmlGenerator.locale, jsonGenerator.locale]);
		await fs.ensureDir(options.rosey.full_generated_locale_dest_path);
		return fs.writeJSON(options.rosey.full_generated_locale_dest, contents);
	},

	/**
     * Generates a comparison of rosey/source.json and rosey/locales/*.json at rosey/checks.json.
     * This is not run as part of the rosey command.
     *
     * @param {Object} options The options object.
     */
	check: function (options) {
		return new Promise((resolve, reject) => {
			readLocalesFromDir(options.rosey.locale_source, (errReadLocales, returnedLocales) => {
				if (errReadLocales) {
					log(`${c.red('Unable to read locales')} from ${
						c.blue(options.rosey.locale_source)}: ${errReadLocales.message}`);
					return reject(errReadLocales);
				}

				log(`Loading ${path.join(options.rosey.generated_locale_dest)}...`);
				fs.readFile(path.join(options.rosey.generated_locale_dest), (errReadFile, data) => {
					if (errReadFile) {
						log(`${c.red('Unable to read source')} from ${
							c.blue(path.join(options.rosey.generated_locale_dest))}: ${errReadFile.message}`);
						log(c.yellow('You must execute `rosey generate` before using the `check` command'));
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
						if (options.rosey.source_version > 1) {
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
								unused: 0
							},
							keys: {}
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

					const outputFilename = path.join(options.rosey.full_generated_locale_dest_path, 'checks.json');
					fs.writeFile(outputFilename, JSON.stringify(output, null, '\t'));
					log(c.green(`Checks file created on ${outputFilename}`));
					return resolve();
				});
			});
		});
	},

	/**
     * Generates the converted version of the current v1 locales files
     * from rosey/locales/*.json to rosey/locales/v2/*.json.
     * This is not run as part of the rosey command.
     *
     * @param {Object} options The options object.
     */
	convert: function (options) {
		return new Promise((resolve, reject) => {
			log(`Loading ${path.join(options.rosey.generated_locale_dest)}...`);
			fs.readJSON(path.join(options.rosey.generated_locale_dest))
				.then((source) => {
					if (!source.version || source.version < 2) {
						const errVersion = new Error('Convert is only possible from a Version 2 source file. You must run `rosey generate --version 2` before using the `convert` command');
						log(c.yellow(errVersion.message));
						return reject(errVersion);
					}
					const promises = [];
					readLocalesFromDir(options.rosey.locale_source, (errReadLocales, returnedLocales) => {
						if (errReadLocales) {
							log(`${c.red('Unable to read locales')} from ${
								c.blue(options.rosey.locale_source)}: ${errReadLocales.message}`);
							return reject(errReadLocales);
						}
						Object.keys(returnedLocales).forEach((localeCode) => {
							const keys = {};
							let convert = true;
							Object.keys(returnedLocales[localeCode]).forEach((tag) => {
								const { translation } = returnedLocales[localeCode][tag];
								if (typeof translation !== 'object') {
									keys[tag] = {
										original: source.keys[tag] ? source.keys[tag].original : null,
										value: translation
									};
								} else {
									convert = false;
								}
							});
							if (convert) {
								const folderpath = path.join(options.rosey.locale_source, 'v2');
								const fileName = `${localeCode}.json`;
								const filePath = path.join(folderpath, fileName);
								promises.push(fs.outputFile(filePath, JSON.stringify(keys, null, options.rosey.source_delimeter || '')).then(() => log(c.green(`Saved converted file to: ${filePath}`))));
							}
						});
						Promise.all(promises).then(() => resolve());
					});
				})
				.catch((errReadingSource) => {
					log(c.red('Unable to read source file'));
					return reject(errReadingSource);
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
	rosey: async function (options) {
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
	build: async function (options) {
		// Load locales files
		const loadLocalesProm = loadLocales(options)
			.then(() => { log(c.green('Finished loading locales.')); })
			.catch(() => 1);

		// Clean up the dest folder
		const cleaned = await this.clean(options);
		if (typeof cleaned === 'number') {
			log.error('Error cleaning the destination folder');
			return cleaned; // errored in clean
		}

		// Wait for locales to be loaded

		const loaded = await loadLocalesProm;
		if (typeof loaded === 'number') {
			// log(c.red('Error loading locales files.'));
			return 1; // errored in loading locales;
		}

		// Call to wrap words for some languages
		const wrapCharactersProm = wrapCharacters(options)
			.then(() => { log(c.green('Finished wrapping characters.')); });

		const cloneAssetsProm = cloneAssets(options)
			.then(() => { log(c.green('Finished clonning assets.')); });

		const clonePrelocalisedHtmlPagesProm = clonePrelocalisedHtmlPages(options)
			.then(() => { log(c.green('Finished clonning prelocalised pages.')); });

		await wrapCharactersProm;
		// Update locales for languages that
		await loadWordwraps(options)
			.then(() => { log(c.green('Finished re-loading wrapped locales.')); });

		const translateHtmlPagesProm = translateHtmlPages(options)
			.then(() => { log(c.green('Finished translating pages.')); });

		await cloneAssetsProm;
		await clonePrelocalisedHtmlPagesProm;
		await translateHtmlPagesProm;

		await generateRedirectHtmlPages(options)
			.then(() => { log(c.green('Finished generating the Redirect HTML page.')); });

		return 0;
	},

	/**
     * Clones the base of the translated website.
     * Assumes that all the locales from the locales folder will eventually be generated as well.
     * @param {Object} options The options object.
     */
	base: async function (options) {
		// Load locales files
		await loadLocales(options)
			.then(() => { log(c.green('Finished loading locales.')); });

		await cloneAssets(options)
			.then(() => { log(c.green('Finished clonning assets.')); });

		await generateRedirectHtmlPages(options)
			.then(() => { log(c.green('Finished generating the Redirect HTML page.')); });

		return 0;
	},

	/**
     * Translate websites to speficic languages only.
     * @param {Object} options The options object.
     */
	translate: async function (options) {
		// Load locales files
		await loadLocales(options)
			.then(() => { log(c.green('Finished loading locales.')); });

		// Call to wrap words for some languages
		await wrapCharacters(options)
			.then(() => { log(c.green('Finished wrapping characters.')); });

		// Update locales for languages that
		await loadWordwraps(options)
			.then(() => { log(c.green('Finished re-loading wrapped locales.')); });

		const translateHtmlPagesProm = translateHtmlPages(options)
			.then(() => { log(c.green('Finished translating pages.')); });

		const clonePrelocalisedHtmlPagesProm = clonePrelocalisedHtmlPages(options)
			.then(() => { log(c.green('Finished clonning prelocalised pages.')); });

		// await cloneAssetsProm;
		await translateHtmlPagesProm;
		await clonePrelocalisedHtmlPagesProm;

		return 0;
	},

	/**
     * Deletes dest and all files contained in dest.
     * @param {Object} options The options object.
     */
	clean: async function (options) {
		if (fs.pathExistsSync(options.rosey.dest)) {
			const question = `Warning: The destination ${options.rosey.dest} already exists.`
            + ' Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): ';
			const isYes = !options.flags.yes ? this.askYesNo(question) : options.flags.yes;
			if (!isYes) return 1;
		}
		log(`Cleaning ${options.rosey.dest}`);
		return del(options.rosey.dest);
	},

	/**
     * Serves the translated websites based on a local browser
     * @param {Object} options The options object.
     */
	serve: async function (options) {
		browserSync.init({
			server: {
				baseDir: options.rosey.dest
			},
			port: options.serve.port
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
	watch: function (options) {
		// log("watching folders..."+options.rosey.locale_source);
		const watchOptions = {
			awaitWriteFinish: {
				stabilityThreshold: 1000
			}
		};
		chokidar.watch(`${options.rosey.locale_source}/*.json`, watchOptions).on('change', (event, pathLocales) => {
			log(`${pathLocales} has been modified (${event}). Reloading...`);
			this.reload(options);
		});

		chokidar.watch(`${options.rosey.source}/**/*`, watchOptions).on('change', (event, pathSource) => {
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
	reload: async function (options) {
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
	reloadBrowser: function () {
		browserSync.reload();
	}

};
