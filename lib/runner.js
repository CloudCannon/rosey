const i18n = require("./plugins/i18n");

const async = require("async");
const c = require("ansi-colors");
const del = require("del");
const fs = require("fs-extra");
var glob = require("glob")
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
    log("Reading locales from: "+dir);
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
        log("Copy Assects from: ", options.i18n.full_source," to: ",options.i18n.full_dest);
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

        return async.each(localeNames, function (targetLocale, next) {

            vfs.src(options.i18n.source + "/**/*.html")
                .pipe(i18n.translate({
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

        if (!options.flags.overwrite && fs.pathExistsSync(options.i18n.dest)) {
            const question = "Warning: The destination " + options.i18n.dest + " already exists." 
            + " Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): "
            const isYes = this._askYesNo(question);
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

        let loadLocales = _loadLocales(options);

        // TODO: "i18n:add-character-based-wordwraps"
        // TODO: "i18n:load-wordwraps"
        
        let cloneAssets = _cloneAssets( options );
        
        //Wait for the async
        await loadLocales; 
        await cloneAssets;

        let translateHtmlPages = _translateHtmlPages( options );
         
        await translateHtmlPages;

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