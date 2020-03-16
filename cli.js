const runner = require("./lib/runner");

const chalk = require('chalk');
const defaults = require("defaults");
const log = require('fancy-log');
const path = require("path");


/**
* Factory function for creating commands. 
* @param {function} func The function that calling this command will run. These functions 
* are usually included in the runner class. Implementing new functinoality shoud
* be done n runner.js.
* @return {Object} The command.
*/
const command = ( func, requiredFlags = []) => {
    return {
        run: func,
        requiredFlags: requiredFlags
    }
}


/**
 The different commands for operation. New commands can be specified here.
 Each command requires a function to run, and a lsi of required flags. 
 Required flags will be checked before the command is run.
*/
const commands = {
    "build": command(runner.build),
    "clean": command(runner.clean),
    "help": command(runner.help),
    "i18n": command(runner.i18n),
    "serve": command(runner.serve),
    "watch": command(runner.watch),
    "wrapCharacters": command(runner.wrapCharacters)
    
}

const defaultDest = "dist/prod";

var optionsDefaults = {
	i18n: {
		source: "dist/site",
		dest: "dist/translated_site",

		default_language: "en",
		locale_source: "i18n/locales",
		generated_locale_dest: "i18n",
		source_version: 2,
		source_delimeter: "\t",

		legacy_path: "_locales",


		show_duplicate_locale_warnings: true,
		show_missing_locale_warnings: true,
		show_skipped_updates: true,

		character_based_locales: ["ja", "ja_jp", "ja-jp"],
		google_credentials_filename: null
    },
    flags: {
    },
	serve: {
		port: 8000,
		open: true,
		path: "/"
	}
};

let exitCode = 0;


module.exports = { 
    /**
     * Checks if the required flags for a command were given by the user.
     * 
     * @param {string[]} requiredFlags An array of the required flags for the command (in any order).
     */
    checkRequiredFlags: function ( enteredFlags, requiredFlags ) {
        if ( requiredFlags.every(flag => { return flag in enteredFlags; }) ) return true;

        log.error( chalk.red("required flags:") );
        log.error( chalk.red( requiredFlags ) );
        exitCode = 1;
        return false;
    },

    /**
     * Checks a given port number to see if it is valid.
     * 
     * @param {string} portString
     * @returns {number} The number representation of portString on no-error.
     *                  Returns the default port number on error.
     */
    checkPortNumber: function ( portString ) {
        if ( !portString ) return;

        let port = parseInt(portString);
        let defaultString = "Reverting to default port (" + optionsDefaults.serve.port + ").";

        if ( !port ){
            log.error(chalk.yellow(portString + " is not a valid port number."));
            log.error(chalk.yellow(defaultString));
            return;
        }

        if ( port < 1024 || port > 65535 ) {
            log.error(chalk.yellow("Port number outside of allowed range. (1024 - 65535)."));
            log.error(chalk.yellow(defaultString));
            return;
        }

        return port;
    },    
    /**
    * Function that ajusts the options that the cli runs on.
    * 
    * @param {Object} Flags the flags that were set by the user in the command line.
    * @return {Object} An object containing information on how to run the given CLI command.
    */
    setOptions: function ( {flags, help}){
        
        let options = {};
        options = defaults(options, optionsDefaults);
        //options.flags = defaults(options.flags, optionsDefaults.flags);
        //options.serve = defaults(options.serve, optionsDefaults.serve);
        
        let cwd = process.cwd();
        let dest = flags["dest"] || options.i18n.dest;
        let source = flags["source"] || options.i18n.source;
        let port = this.checkPortNumber(flags["port"]) || options.serve.port;

        

        options.cwd = cwd;
        options.help = help;

        //i18n
        options.i18n.dest = dest;
        options.i18n.source = source;
        options.i18n.full_dest = path.join(cwd, dest);
        options.i18n.full_source = path.join(cwd, source);
        options.i18n.full_locale_source = path.join(cwd, options.i18n.locale_source);
        options.i18n.full_generated_locale_dest = path.join(cwd, options.i18n.generated_locale_dest);
        options.i18n.full_legacy_path = path.join(cwd, options.i18n.legacy_path);

        //flags
        options.flags.overwrite = flags["overwrite"];

        //port
        options.serve.port = port;


        

        
        return options;
    },

    /**
     ** Takes the command line arguments and runs the appropriate commands.
     ** 
     ** @param {Object} cli The meow object that handled the user input.
     ** @return {int} Returns the exit code of the operation. (0) means no error,
     ** non-zero means an error occured.
     **/
    run: async function ( cli ) {
        exitCode = 0;


        let options = this.setOptions( cli );

        let date = new Date()
        let startTime = date.getTime();

        let cmd = cli.input[0] || "i18n";
        
        if (commands[cmd]){
            if (this.checkRequiredFlags(cli.flags, commands[cmd].requiredFlags)){
                let exit = await commands[cmd].run.call(runner, options); //run function in the context of the runner module.
                if (typeof exit === "number"){
                    exitCode = exit;
                }
            } 
        } else {
            log(chalk.red("command not recognized"));
            log(cli.help);
            exitCode = 1;
        }

        let end = new Date();
        let elapsedTime = end.getTime() - startTime;
        log(chalk.yellow("⏱  process completed in " + elapsedTime + " ms. "));

        return exitCode;
    }
    
}