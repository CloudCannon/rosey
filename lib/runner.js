const async = require("async");
const c = require("ansi-colors");
const del = require("del");
const fs = require("fs-extra");
const log = require("fancy-log");
const path = require("path");
const readlineSync = require("readline-sync");


//TODO: Refactor method
function readLocalesFromDir(dir, done) {
    
    log("readLLocalesFromDir: " + dir)
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
     * Continuously watches the dest/baseurl directory to check for changes. If a change
     * occurs, then the browswer that is viewing the local webserver will be reloaded, so
     * that the new content can be viewed. Because this process runs continously, it does
     * not return an exit code and must be cancelled by the user in-terminal.
     * 
     * @param {Object} options The options object.
     */
    
    _loadLocales: async function( options ) {
		readLocalesFromDir(options.i18n.full_locale_src, function (err, returnedLocales) {
			if (!err) {
                log("no err")
				locales = returnedLocales;
				locales[options.i18n.default_language] = null;
                localeNames = Object.keys(locales);
			} else {
				log(c.red("Unable to read locales") + " from "
					+ c.blue(options.i18n.full_locale_src) + ": " + err.message);
			}
			return err;
		});
    },
    
    help: function( options ) {
        log(options.help);

    },
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
            log.error("Error cleaning the destination fodler");
            return del; //errored in clean
        }
        let loadLocales = await this._loadLocales(options);
        
        return 0;
    },

    
    _askYesNo: function(question, responseOverride = false){ 
        if (responseOverride){
            var response = responseOverride;
        } else {
            var response = readlineSync.question( question );
        }
        if (!(response === "Y" || response === "y")){
            log("Process cancelled by user. exiting...");
            return false;
        }
        return true;
    }
}