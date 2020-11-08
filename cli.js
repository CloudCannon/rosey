/* eslint-disable linebreak-style */
const chalk = require('chalk');
const defaults = require('defaults');
const log = require('fancy-log');
const path = require('path');

const runner = require('./lib/runner');

/**
* Factory function for creating commands.
* @param {function} func The function that calling this command will run. These functions
* are usually included in the runner class. Implementing new functinoality shoud
* be done n runner.js.
* @return {Object} The command.
*/
const command = (func, requiredFlags = []) => ({
	run: func,
	requiredFlags: requiredFlags
});

/**
* The different commands for operation. New commands can be specified here.
* Each command requires a function to run, and a lsi of required flags.
* Required flags will be checked before the command is run.
*/
const commands = {
	build: command(runner.build),
	base: command(runner.base),
	check: command(runner.check),
	clean: command(runner.clean),
	convert: command(runner.convert),
	generate: command(runner.generate),
	help: command(runner.help),
	rosey: command(runner.rosey),
	translate: command(runner.translate, ['languages']),
	serve: command(runner.serve),
	watch: command(runner.watch)
};

const optionsDefaults = {
	rosey: {
		source: 'dist/site',
		dest: 'dist/translated_site',

		default_language: 'en',
		locale_source: 'rosey/locales',
		generated_locale_dest: 'rosey/source.json',
		source_version: 2,
		source_delimeter: '\t',
		data_tag: 'data-rosey',

		show_duplicate_locale_warnings: false,
		show_missing_locale_warnings: false,
		show_skipped_updates: false,

		character_based_locales: ['ja', 'ja_jp', 'ja-jp'],
		google_credentials_filename: null
	},
	flags: {
	},
	serve: {
		port: 8000,
		open: true,
		path: '/'
	}
};

let exitCode = 0;

module.exports = {
	/**
     * Checks if the required flags for a command were given by the user.
     *
     * @param {string[]} enteredFlags An array of the entered flags for the command.
     * @param {string[]} requiredFlags An array of the required flags for the command.
     */
	checkRequiredFlags: function (enteredFlags, requiredFlags) {
		if (requiredFlags.every((flag) => flag in enteredFlags)) return true;
		log.error(chalk.red('required flags:'));
		log.error(chalk.red(requiredFlags));
		exitCode = 1;
		return false;
	},

	/**
     * Checks a given port number to see if it is valid.
     * @param {string} portString
     * @returns {number} The number representation of portString on no-error.
     *                  Returns the default port number on error.
     */
	checkPortNumber: function (portString) {
		if (!portString) return optionsDefaults.serve.port;

		const port = parseInt(portString, 10);
		const defaultString = `Reverting to default port (${optionsDefaults.serve.port}).`;

		if (!port) {
			log.error(chalk.yellow(`${portString} is not a valid port number.`));
			log.error(chalk.yellow(defaultString));
			return optionsDefaults.serve.port;
		}

		if (port < 1024 || port > 65535) {
			log.error(chalk.yellow('Port number outside of allowed range. (1024 - 65535).'));
			log.error(chalk.yellow(defaultString));
			return optionsDefaults.serve.port;
		}

		return port;
	},
	/**
    * Function that ajusts the options that the cli runs on.
    *
    * @param {Object} Flags the flags that were set by the user in the command line.
    * @return {Object} An object containing information on how to run the given CLI command.
    */
	setOptions: function ({ flags, help }) {
		let options = {};
		options = defaults(options, optionsDefaults);

		const cwd = process.cwd();
		const dest = flags.dest || options.rosey.dest;
		const source = flags.source || options.rosey.source;
		const localeSource = flags.localeSource || options.rosey.locale_source;
		const localeDest = flags.localeDest || options.rosey.generated_locale_dest;

		options.cwd = cwd;
		options.help = help;

		// rosey
		options.rosey.dest = dest;
		options.rosey.source = source;
		options.rosey.locale_source = localeSource;
		options.rosey.generated_locale_dest = localeDest;
		options.rosey.generated_locale_dest_path = path.dirname(localeDest);
		options.rosey.generated_locale_dest_file = path.basename(localeDest);

		options.rosey.full_dest = path.resolve(cwd, dest);
		options.rosey.full_source = path.resolve(cwd, source);
		options.rosey.full_locale_source = path.resolve(cwd, localeSource);
		options.rosey.full_generated_locale_dest = path.resolve(cwd, localeDest);
		// eslint-disable-next-line max-len
		options.rosey.full_generated_locale_dest_path = path.resolve(cwd, options.rosey.generated_locale_dest_path);

		options.rosey.credentials = flags.credentials;
		options.rosey.data_tag = flags.tag || options.rosey.data_tag;
		options.rosey.default_language = flags.defaultLanguage || options.rosey.default_language;
		options.rosey.source_delimeter = flags.sourceDelimeter || options.rosey.source_delimeter;

		options.rosey.source_version = flags.version || options.rosey.source_version;

		options.rosey.show_duplicate_locale_warnings = flags.verbose;
		options.rosey.show_missing_locale_warnings = flags.verbose;
		options.rosey.show_skipped_updates = flags.verbose;

		// flags
		options.flags.yes = flags.yes;
		options.flags.partialLanguages = flags.languages ? flags.languages.toUpperCase().split(',') : null;

		// port
		options.serve.port = this.checkPortNumber(flags.port) || options.serve.port;

		return options;
	},

	/**
     ** Takes the command line arguments and runs the appropriate commands.
     **
     ** @param {Object} cli The meow object that handled the user input.
     ** @return {int} Returns the exit code of the operation. (0) means no error,
     ** non-zero means an error occured.
     * */
	run: async function (cli) {
		exitCode = 0;

		const options = this.setOptions(cli);

		const date = new Date();
		const startTime = date.getTime();

		const cmd = cli.input[0] || 'rosey';

		if (commands[cmd]) {
			if (this.checkRequiredFlags(cli.flags, commands[cmd].requiredFlags)) {
				// run function in the context of the runner module.
				const exit = await commands[cmd].run.call(runner, options);
				if (typeof exit === 'number') {
					exitCode = exit;
				}
			}
		} else {
			log(chalk.red('command not recognized'));
			log(cli.help);
			exitCode = 1;
		}

		const end = new Date();
		const elapsedTime = end.getTime() - startTime;
		log(chalk.yellow(`⏱  process completed in ${elapsedTime} ms. `));

		return exitCode;
	}

};
