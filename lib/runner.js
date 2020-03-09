const log = require("fancy-log");


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

    } 
}