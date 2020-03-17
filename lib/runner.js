const i18n = require("./plugins/i18n");
const wordwrap = require("./plugins/wordwrap-json");

const async = require("async");
const browserSync = require('browser-sync').create();
const c = require("ansi-colors");
const chokidar = require("chokidar");
const del = require("del");
const fs = require("fs-extra");
const log = require("fancy-log");
const path = require("path");
const readlineSync = require("readline-sync");
const rename = require("gulp-rename");

var vfs = require('vinyl-fs');

const regex = {
    html: /\.html?$/
}

var locales, localeNames; // holds locales between stages

//TODO: Refactor method
function _readLocalesFromDir(dir, done) {
    var returnedLocales = {};
    fs.readdir(dir, function(err, files) {
        if (err) {
            return done(err);
        }
        

        async.each(files, function (filename, next) {
            if (!/\.json$/.test(filename)) {
                return next();
            }

            fs.readFile(path.join(dir, filename), function read(err, data) {
                if (err) {
                    log(err);
                    return next(err);
                }

                var key = filename.replace(/\.json$/, "");
                try {
                    returnedLocales[key] = JSON.parse(data);
                } catch (e) {
                    log(c.red("Malformed JSON") + " from "
                        + c.blue(dir + "/" + filename) + ": " + e.message);
                }

                for (var localeKey in returnedLocales[key]) {
                    if (returnedLocales[key].hasOwnProperty(localeKey)) {
                        var localeObj =  returnedLocales[key][localeKey];
                        var translation;
                        if (typeof localeObj === 'object') {
                            //Version 2
                            //log("localeObj.value: "+ localeObj.value)
                            translation = localeObj.value;
                        }
                        else{
                            //Version 1
                            //log("localeObj: "+ localeObj)
                            translation = localeObj;
                        }
                        returnedLocales[key][localeKey] = {
                            translation: returnedLocales[key][localeKey],
                            count: 0
                        };
                    }
                }
                next();
            });
        }, function (err) {
            done(err, returnedLocales);
        });
    });
};

/**
*  Load the JSON files form the locale folder and save into global variables
* 
* @param {Object} options The options object.
*/
function _loadLocales(options) {
    return new Promise(resolve => {
        _readLocalesFromDir(options.i18n.full_locale_source, function (err, returnedLocales) {
            if (!err) {
                locales = returnedLocales;
                locales[options.i18n.default_language] = null;
                localeNames = Object.keys(locales);
            } else {
                log(c.red("Unable to read locales") + " from "
                    + c.blue(options.i18n.full_locale_source) + ": " + err.message);
            }
            resolve(err);
        });
      })
    
};

/**
 * Copy all files expect .HTML ones from source to dest
 * 
 * @param {Object} options The options object.
 */
function _cloneAssets(options) {

    const filterFunc = (source, dest) => {
        // it will be copied if return true
        return !regex.html.test(source);
        }

    async function copyAssets(options) {
        try {
            await fs.copy(options.i18n.full_source, options.i18n.full_dest, { filter: filterFunc })
        } catch (err) {
            return err;
        }
    }
        
    log("Starting clonning assets.")
    return copyAssets(options)

};

/**
 * Translate all HTML pages based on the locales file.
 * 
 * @param {Object} options The options object.
 */
function _translateHtmlPages(options) {

    log("Starting translating pages.")
        return async.each(localeNames, function (targetLocale, next) {

            vfs.src(options.i18n.source + "/**/*.html")
                .pipe(i18n.translate({
                    showSkippedUpdates: options.i18n.show_skipped_updates,
                    showMissingLocaleWarnings: options.i18n.show_missing_locale_warnings,
                    addOtherLocaleAlternates: true,
                    targetLocale: targetLocale,
                    localeNames: localeNames,
                    locales: locales
                }))
                .pipe(rename(function (path) {
                    path.dirname = path.dirname.replace(/^\/+/, "") || ".";
                }))
                .pipe(vfs.dest(path.join(options.i18n.dest, targetLocale)))
                .on('end', next);
            
        });

};

/**
 * Copy the PreLocalized HTML pages and update internal links
 * 
 * @param {Object} options The options object.
 */
function _clonePrelocalisedHtmlPages(options) {
    log("Starting clonning prelocalised pages.")
    return async.each(localeNames, function (targetLocale, next) {
        vfs.src(options.i18n.source + "/" + targetLocale + "/**/*.html")
            .pipe(i18n.translate({
                showSkippedUpdates: options.i18n.show_skipped_updates,
                showMissingLocaleWarnings: options.i18n.show_missing_locale_warnings,
                addOtherLocaleAlternates: false,
                targetLocale: targetLocale,
                localeNames: localeNames,
                locales: locales
            }))
            .pipe(vfs.dest(path.join(options.i18n.dest , targetLocale)))
            .on('end', next);
    });

};

/**
 * Generates the Reditect HTML Page
 * 
 * @param {Object} options The options object.
 */
function _generateRedirectHtmlPages(options) {
    log("Starting generating the Redirect HTML page.")
    
    return new Promise(resolve => {
        vfs.src(options.i18n.source + "/**/*.html")
        .pipe(i18n.redirectPage({
            defaultLocale: options.i18n.default_language,
            localeNames: localeNames,
            locales: locales
        })).pipe(vfs.dest(options.i18n.dest))
        resolve();
      })
};


function _wordwrapLocale(targetLocale, jsonString, done) {
    let output = {};
    let locale = JSON.parse(jsonString);
    let keys = Object.keys(locale);
    async.eachLimit(keys, 50, function (key, next) {	
        let translation = locale[key];
        if (translation.includes("</") || key.includes("meta:")) {
            output[key] = translation;

            return setImmediate(next);
        }


        wordwrap.parse({
            text: translation, 
            language: targetLocale, 
            attributes: {"class":"wordwrap"}
        }, function (err, parsed) {
            if (parsed) {
                output[key] = parsed.replace(/\n/g, ' ').replace(/\r/g, '');
            }
            next(err);
        });
    }, function (err) {
        let sortedOutput = {};
        Object.keys(output).sort().forEach(function(key){
            sortedOutput[key] = output[key]; 
        });
        done(err, err ? null : JSON.stringify(sortedOutput, null, "\t"));
    });
}


function _loadWordwraps(options) {
    return new Promise(resolve => {
        var wrappedDir = path.join(options.i18n.locale_source, "../wrapped");
        _readLocalesFromDir(wrappedDir, function (err, returnedLocales) {
			if (!err) {
				for (var localeName in returnedLocales) {
					if (returnedLocales.hasOwnProperty(localeName)) {
						log(localeName + " loaded from wrapped");
						locales[localeName] = returnedLocales[localeName];
					}
				}
			} else {
				log(c.yellow("Wrapped files not found: ") + c.red(err.message));
			}
            resolve(err);
        });
      })    
}

module.exports = {
    
    /**
     * Queries the user for a yes/no response.
     * 
     * @param {String} question The question to ask the user.
     * @returns {Boolean} True on a yes response, false otherwise.
     */
    _askYesNo: function(question, responseOverride = false){ 

        var response = responseOverride ? responseOverride : readlineSync.question( c.green(question) );

        if (!(response === "Y" || response === "y")){
            log(c.red("Process cancelled by user. exiting..."));
            return false;
        }
        return true;
    },

    /**
     * Display the help message.
     * 
     * @param {Object} options The options object.
     */
    help: function( options ) {
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
    generate: function ( options ) {

        log(c.green("Generating source locale") + " from "
			+ c.blue(options.i18n.full_source)
			+ " to "
			+ c.blue(options.i18n.full_generated_locale_dest));

        return new Promise(resolve => {
            vfs.src(options.i18n.full_source + "/**/*.html")
			.pipe(i18n.generate({
				version: options.i18n.source_version, 
				delimeter: options.i18n.source_delimeter,
				showDuplicateLocaleWarnings: options.i18n.show_duplicate_locale_warnings
			}))
            .pipe(vfs.dest(options.i18n.full_generated_locale_dest))
            .on('end', resolve);
            }) 
    },
    

    /**
     * Generates a comparison of i18n/source.json and i18n/locales/*.json at i18n/checks.json. 
     * This is not run as part of the i18n command.
     * 
     * @param {Object} options The options object.
     */
    check: function ( options ) {

        return new Promise((resolve, reject) => {
            _readLocalesFromDir(options.i18n.locale_source, function (err, returnedLocales) {
                if (err) {
                    log(c.red("Unable to read locales") + " from "
                        + c.blue(options.i18n.locale_source) + ": " + err.message);
                    return resolve(err);
                }
    
                log("Loading " + path.join(options.i18n.generated_locale_dest, "source.json") + "...");
                fs.readFile(path.join(options.i18n.generated_locale_dest, "source.json"), function (err, data) {
                    
                    if (err) {
                        log(err);
                        return reject(err);
                    }

                    let source = JSON.parse(data);
                    let sourceLookup;
    
                    if (source.version) {
                        sourceLookup = source.keys;
                    } else {
                        sourceLookup = source;
                    }
    
                    let sourceKeys = Object.keys(sourceLookup);
                    let output = {};
                    let localeCodes = Object.keys(returnedLocales);
    
                    function compareTranslations(source, target) {
                        if (!target) {
                            return "missing";
                        }
                        
                        //Check for target.translation if running the test check on version 2 but have a file on locales on version 1.
                        if (options.i18n.source_version > 1) {
                            let sourceString = source.original;
                            let targetString = target.translation.original;
    
                            return sourceString === targetString ? "current" : "outdated";
                        }
                        return "current";
                    }
    
                    for (let i = 0; i < localeCodes.length; i++) {
                        const localeCode = localeCodes[i];
                        let translations = returnedLocales[localeCode];
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
                            keys: {}
                        };
    
                        for (let j = 0; j < sourceKeys.length; j++) {
                            const sourceKey = sourceKeys[j];
                            const sourceTranslation = sourceLookup[sourceKey];
                            const targetTranslation = translations[sourceKey];
    
                            let state = compareTranslations(sourceTranslation, targetTranslation);
                            output[localeCode].current = output[localeCode].current && state === "current";
                            output[localeCode].states[state]++;
                            output[localeCode].keys[sourceKey] = state;
                            delete translations[sourceKey];
                        }
    
                        let extraKeys = Object.keys(translations);
                        for (let x = 0; x < extraKeys.length; x++) {
                            const extraKey = extraKeys[x];
                            output[localeCode].current = false;
                            output[localeCode].keys[extraKey] = "unused";
                            output[localeCode].states["unused"]++;
                        }
    
                        if (output[localeCode].current) {
                            log(c.green("✅  '" + localeCode + "' is all up to date"));
                        } else {
                            let logMessages = [];
                            
                            if (output[localeCode].states.missing) {
                                logMessages.push(output[localeCode].states.missing + " missing");
                            }
    
                            if (output[localeCode].states.outdated) {
                                logMessages.push(output[localeCode].states.outdated + " outdated");
                            }
    
                            if (output[localeCode].states.unused) {
                                logMessages.push(output[localeCode].states.unused + " unused");
                            }
    
                            let logMessage = "⚠️  '" + localeCode + "' translations include ";
                            if (logMessages.length > 1) {
                                logMessage += logMessages.slice(0, -1).join(', ') + ' and ' + logMessages.slice(-1);
                            } else {
                                logMessage += logMessages[0];
                            }
                            log(c.yellow(logMessage));
                        }
                    }
    
                    let outputFilename = path.join(options.i18n.generated_locale_dest, "checks.json");
                    fs.writeFile(outputFilename, JSON.stringify(output, null, "\t"));
                    log(c.green(`Checks file created on ${outputFilename}`))
                    resolve();
                });
                
            });
          })

    },
    
    /**
     * Default command (runs when no command is specified).
     * Builds, serves, and watches.
     * 
     * @param {Object} options The options object.
     * @returns {number} The exit code.
     */
    i18n: async function ( options ) {
        let exit = await this.build( options );
        if (exit > 0) return exit;
        this.serve( options );
        this.watch( options );
        return 0;
    },
    
    /**
     * Builds the translated websites based on the locales files
     * @param {Object} options The options object.
     */
    build: async function( options ) {


        //Load locales files
        let loadLocales = _loadLocales(options);

        //Clean up the dest folder
        let del = await this.clean( options );
        if (typeof del === "number") {
            log.error("Error cleaning the destination folder");
            return del; //errored in clean
        }


        //Wait for locales to be loaded
        await loadLocales; 

        //Call to wrap words for some languages
        await this.wrapCharacters(options);
       
        //Update locales for languages that 
        await _loadWordwraps(options);

        let cloneAssets = _cloneAssets( options ).then(()=>{log("Finished clonning assets.");} );
        
        let translateHtmlPages = _translateHtmlPages( options ).then(()=>{log("Finished translating pages.");} );
        
        let clonePrelocalisedHtmlPages = _clonePrelocalisedHtmlPages( options ).then(()=>{log("Finished clonning prelocalised pages.");} );
        

        await cloneAssets;
        await translateHtmlPages;
        await clonePrelocalisedHtmlPages;

        let generateRedirectHtmlPages = _generateRedirectHtmlPages( options ).then(()=>{log("Finished generating the Redirect HTML page.");} );
        await generateRedirectHtmlPages;
        
        return 0;
    },
    
    /**
     * Deletes dest and all files contained in dest.
     * @param {Object} options The options object.
     */
    clean: async function( options ) {

        if (fs.pathExistsSync(options.i18n.dest)) {
            const question = "Warning: The destination " + options.i18n.dest + " already exists." 
            + " Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): "
            const isYes = !options.flags.overwrite ? this._askYesNo(question) : options.flags.overwrite;
            if (!isYes) return 1; 
        }
        log("Cleaning " + options.i18n.dest)
        return del(options.i18n.dest);
    },

    /**
     * Builds the translated websites based on the locales files
     * @param {Object} options The options object.
     */
    serve: async function( options ) {

        browserSync.init({
			server: {
				baseDir: options.i18n.dest
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
    watch: function( options ) {
        //log("watching folders..."+options.i18n.locale_source);
        var watchOptions = {
            awaitWriteFinish: {
                stabilityThreshold: 1000
            }
        }
        chokidar.watch(options.i18n.locale_source + "/*.json",watchOptions).on("change", (event, path) => {
            log(path + " has been modified (" + event + "). Reloading...");
            this.reload(options);
        })

        
        chokidar.watch(options.i18n.source + "/**/*",watchOptions).on("change", (event, path) => {
            log(path + " has been modified (" + event + "). Reloading...");
            this.reload(options);
            this.generate(options);
        })
    } ,
    /**
     * Rebuild the translated website and refresh the browser
     * 
     * @param {Object} options The options object.
     */
    reload: async function( options ) {
        let exit = await this.build( options );
        if (exit > 0) return exit;
        this.reloadBrowser();
    } ,
    /**
     * Rebuild the translated website and refresh the browser
     * 
     * @param {Object} options The options object.
     */
    reloadBrowser: function() {
		browserSync.reload();
    },
  
    /**
     * Runs a local webserver on the dest folder. 
     * @param {Object} options The options object.
     */
    wrapCharacters: async function( options ) {

        
        if (!localeNames) {
            //await _loadLocales(options);
        }
        
        if (!localeNames) {
			log("loadLocales must be run to load the locales first");
			return 1;
		}
        
        //Change this to a cli flag?
		if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			log("Environment variable GOOGLE_APPLICATION_CREDENTIALS not found");
			log("export GOOGLE_APPLICATION_CREDENTIALS=\"/PATH/TO/CREDENTIALS/google-creds.json\"");
			return 1;
		}

		var wrappedDir = path.join(options.i18n.locale_source, "../wrapped");

        await fs.ensureDir(wrappedDir).then(() => {
			return async.eachSeries(localeNames, function (targetLocale, next) {
                

				if (options.i18n.character_based_locales.indexOf(targetLocale) < 0) {
					return next();
				}

				if (!wordwrap.isLanguageSupported(targetLocale)) {
					log(targetLocale + " is not supported");
					return next();
				}

				var inputFilename = path.join(options.i18n.locale_source, targetLocale + ".json"),
					outputFilename = path.join(wrappedDir, targetLocale + ".json");

				fs.readFile(inputFilename, function (err, data) {
                    log(`Processing character wrapping for: ${targetLocale}`);
					if (err) {
                        log(err);
						return 1;
					}
					
					_wordwrapLocale(targetLocale, data.toString("utf8"), function (err, output) {
						if (err) {
							console.error(targetLocale + ": failed to wrap", err);
							return next(err);
						}
		
						fs.writeFile(outputFilename, output, function (err) {
							if (err) {
								console.error(targetLocale + ": failed to wrap", err);
								return next(err);
							}
		
							return next();
						});
					});
				});
			});
        });
    }
}