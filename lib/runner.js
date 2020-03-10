const async = require("async");
const c = require("ansi-colors");
const del = require("del");
const fs = require("fs-extra");
const log = require("fancy-log");
const path = require("path");
const readlineSync = require("readline-sync");


const regex = {
    html: /\.html?$/
}

//TODO: Refactor method
function readLocalesFromDir(dir, done) {
    
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
}

var locales, localeNames; // holds locales between stages

module.exports = {

    
    /**
     * Load the JSON files form the locale folder and save into global variables
     * 
     * @param {Object} options The options object.
     */
    _loadLocales: async function( options ) {
		readLocalesFromDir(options.i18n.full_locale_source, function (err, returnedLocales) {
			if (!err) {
                log("no err")
				locales = returnedLocales;
				locales[options.i18n.default_language] = null;
                localeNames = Object.keys(locales);
			} else {
				log(c.red("Unable to read locales") + " from "
					+ c.blue(options.i18n.full_locale_source) + ": " + err.message);
			}
			return err;
		});
    },
    
    /**
     * Copy all files expect .HTML ones from source to dest
     * 
     * @param {Object} options The options object.
     */
    _cloneAssets: async function( options ) {

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
          copyAssets(options)
          
          log("Finished clonning assets.")

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
     * Deletes dest and all files contained in dest.
     * @param {Object} options The options object.
     */
    clean: async function( options ) {

        if (!options.flags.overwrite && fs.pathExistsSync(options.i18n.dest)) {
            const question = "Warning: The destination " + options.i18n.dest + " already exists." 
            + " Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): "
            const isYes = await this._askYesNo(question);
            if (!isYes) return 1; 
        }
        log("Cleaning " + options.i18n.dest)
        return del(options.i18n.dest);
    },
    
    build: async function( options ) {

        let del = await this.clean( options );
        if (typeof del === "number") {
            log.error("Error cleaning the destination folder");
            return del; //errored in clean
        }
        let loadLocales = await this._loadLocales(options);

        // TODO: "i18n:add-character-based-wordwraps"
		// TODO: "i18n:load-wordwraps"
        
        await this._cloneAssets( options );


        return 0;
    },

    
    /**
     * Queries the user for a yes/no response.
     * 
     * @param {String} question The question to ask the user.
     * @returns {Boolean} True on a yes response, false otherwise.
     */
    _askYesNo: function(question, responseOverride = false){ 

        var response = responseOverride ? responseOverride : readlineSync.question( question );

        if (!(response === "Y" || response === "y")){
            log("Process cancelled by user. exiting...");
            return false;
        }
        return true;
    }
}