const runner = require("./lib/runner");
// const path = require("path");
const log = require('fancy-log');
const chalk = require('chalk');
const defaults = require("defaults");


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
    "help": command(runner.help),
    "clean": command(runner.clean)
}

const defaultDest = "dist/prod";

var configDefaults = {
	i18n: {
		src: "dist/site",
		dest: "dist/translated_site",

		default_language: "en",
		locale_src: "i18n/locales",
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
    * Function that ajusts the options that the cli runs on.
    * 
    * @param {Object} Flags the flags that were set by the user in the command line.
    * @return {Object} An object containing information on how to run the given CLI command.
    */
    setOptions: function ( {flags, help}, config){
        config = config || {};
        config.i18n = defaults(config.i18n, configDefaults.i18n);
        //config.serve = defaults(config.serve, configDefaults.serve);
        
        let options = {
            cwd: process.cwd(),
            help,
            
            i18n: {
                dest: flags["dest"] || config.i18n.dest
            },

            flags:{
                overwrite: flags["overwrite"]
            }
        };


        return options;
    },

    /**
     * Takes the command line arguments and runs the appropriate commands.
     * 
     * @param {Object} cli The meow object that handled the user input.
     * @return {int} Returns the exit code of the operation. (0) means no error,
     * non-zero means an error occured.
     */
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