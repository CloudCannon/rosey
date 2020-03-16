const i18n = require("./plugins/i18n");
const wordwrap = require("./plugins/wordwrap-json");

const async = require("async");
const browserSync = require('browser-sync').create();
const c = require("ansi-colors");
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
                            translation = localeObj.value;
                        }
                        else{
                            //Version 1
                            translation = localeObj;
                        }
                        returnedLocales[key][localeKey] = {
                            translation: translation,
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
     * Display the help message.
     * 
     * @param {Object} options The options object.
     */
    help: function( options ) {
        log(options.help);
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
    },
    
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
    }
}