#!/usr/bin/env node
/* eslint-disable no-console */
const meow = require('meow');
const cli = require('./cli');

const helpString = `
Usage: i18n <command> [args]
Args:
    -s | --source       The source folder to clone. Defaults to dist/site.
    -d | --dest         The destination folder to clone the files to. Defaults to dist/translated_site.
    -p | --port         The port number to serve the site on. Defaults to 8000.
    -v | --version      The version number of the locale file. Defaults to 2.
    -y | --yes          Overrides the user confirmation request to Y.

Commands:
    --Command--                                                     
    build           Generates a translated version of your website to the dest folder.
    clean           Removes all files from the dest folder.
    check           Generates a comparison between source and locales files.
    generate        Generates a lookup table for the marked keys.
    serve           Runs a local webserver on the dest folder.
    watch           Watches the dest folder and reload the local webserver.
`;


/**
 * Takes input from user via command line and outputs an object containing
 * arguments (in camelCase) and flags.
 */
const inputs = meow(
  helpString,
  {
    flags: {
      source: {
        type: 'string',
        alias: 's',
      },
      dest: {
        type: 'string',
        alias: 'd',
      },
      port: {
        type: 'string',
        alias: 'p',
      },
      version: {
        type: 'number',
        alias: 'v',
      },
      yes: {
        type: 'boolean',
        alias: 'y',
      },
    },
  },
);

/**
 * Passes inputs to cli.js
 */
async function run() {
  const exitCode = await cli.run(inputs);
  console.log(`exit code: ${exitCode}`);
  if (exitCode) process.exit(exitCode);
}
run();
