const i18n = require("./plugins/i18n");

const async = require("async");
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
        log("Finished clonning assets.")
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

    log("Starting translating assets.")
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
    log("Starting generating the Redirect HTML page")

    
    return vfs.src(options.i18n.source + "/**/*.html")
        .pipe(i18n.redirectPage({
            defaultLocale: options.i18n.default_language,
            localeNames: localeNames,
            locales: locales
        })).pipe(vfs.dest(options.i18n.dest))


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

        if (fs.pathExistsSync(options.i18n.dest)) {
            const question = "Warning: The destination " + options.i18n.dest + " already exists." 
            + " Continuing will delete this folder and everything in it. Do you wish to continue? (Y or N): "
            const isYes = !options.flags.overwrite ? this._askYesNo(question) : options.flags.overwrite;
            if (!isYes) return 1; 
        }
        log("Cleaning " + options.i18n.dest)
        return del(options.i18n.dest);
    },
    
    build: async function( options ) {

        let loadLocales = _loadLocales(options);

        let del = await this.clean( options );
        if (typeof del === "number") {
            log.error("Error cleaning the destination folder");
            return del; //errored in clean
        }


        // TODO: "i18n:add-character-based-wordwraps"
        // TODO: "i18n:load-wordwraps"
        
        //Wait for the async
        await loadLocales; 

        let cloneAssets = _cloneAssets( options );
        
        let translateHtmlPages = _translateHtmlPages( options );
        
        let clonePrelocalisedHtmlPages = _clonePrelocalisedHtmlPages( options );
        

        await cloneAssets;
        await translateHtmlPages;
        await clonePrelocalisedHtmlPages;

        let generateRedirectHtmlPages = _generateRedirectHtmlPages( options );
        await generateRedirectHtmlPages;
        
        return 0;
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