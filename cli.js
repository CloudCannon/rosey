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
  requiredFlags,
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
  generate: command(runner.generate),
  help: command(runner.help),
  i18n: command(runner.i18n),
  translate: command(runner.translate, ['languages']),
  serve: command(runner.serve),
  watch: command(runner.watch),
};

const optionsDefaults = {
  i18n: {
    source: 'dist/site',
    dest: 'dist/translated_site',

    default_language: 'en',
    locale_source: 'i18n/locales',
    generated_locale_dest: 'i18n',
    source_version: 2,
    source_delimeter: '\t',

    legacy_path: '_locales',


    show_duplicate_locale_warnings: true,
    show_missing_locale_warnings: true,
    show_skipped_updates: true,

    character_based_locales: ['ja', 'ja_jp', 'ja-jp'],
    google_credentials_filename: null,
  },
  flags: {
  },
  serve: {
    port: 8000,
    open: true,
    path: '/',
  },
};

let exitCode = 0;


module.exports = {
  /**
     * Checks if the required flags for a command were given by the user.
     *
     * @param {string[]} enteredFlags An array of the entered flags for the command.
     * @param {string[]} requiredFlags An array of the required flags for the command.
     */
  checkRequiredFlags(enteredFlags, requiredFlags) {
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
  checkPortNumber(portString) {
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
  setOptions({ flags, help }) {
    let options = {};
    options = defaults(options, optionsDefaults);

    const cwd = process.cwd();
    const dest = flags.dest || options.i18n.dest;
    const source = flags.source || options.i18n.source;
    const sourceVersion = flags.version || options.i18n.source_version;
    const port = this.checkPortNumber(flags.port) || options.serve.port;
    const partialLanguages = flags.languages ? flags.languages.toUpperCase().split(',') : null;

    options.cwd = cwd;
    options.help = help;

    // i18n
    options.i18n.dest = dest;
    options.i18n.source = source;
    options.i18n.full_dest = path.join(cwd, dest);
    options.i18n.full_source = path.join(cwd, source);
    options.i18n.full_locale_source = path.join(cwd, options.i18n.locale_source);
    options.i18n.full_generated_locale_dest = path.join(cwd, options.i18n.generated_locale_dest);
    options.i18n.full_legacy_path = path.join(cwd, options.i18n.legacy_path);

    options.i18n.source_version = sourceVersion;

    // flags
    options.flags.yes = flags.yes;
    options.flags.partialLanguages = partialLanguages;

    // port
    options.serve.port = port;


    return options;
  },

  /**
     ** Takes the command line arguments and runs the appropriate commands.
     **
     ** @param {Object} cli The meow object that handled the user input.
     ** @return {int} Returns the exit code of the operation. (0) means no error,
     ** non-zero means an error occured.
     * */
  async run(cli) {
    exitCode = 0;


    const options = this.setOptions(cli);

    const date = new Date();
    const startTime = date.getTime();

    const cmd = cli.input[0] || 'i18n';

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
  },

};
