const log = require("fancy-log");
const del = require("del");
const readlineSync = require("readline-sync");
const fs = require("fs-extra");


module.exports = {

    
    /**
     * Continuously watches the dest/baseurl directory to check for changes. If a change
     * occurs, then the browswer that is viewing the local webserver will be reloaded, so
     * that the new content can be viewed. Because this process runs continously, it does
     * not return an exit code and must be cancelled by the user in-terminal.
     * 
     * @param {Object} options The options object.
     */
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