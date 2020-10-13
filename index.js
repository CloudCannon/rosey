#!/usr/bin/env node
/* eslint-disable no-console */
const meow = require('meow');
const cli = require('./cli');

const helpString = `
Usage: rosey <command> [args]
Args:
    -s | --source       The source folder to copy the website content. Defaults to 'dist/site'.
    -d | --dest         The destination folder to output the files to. Defaults to 'dist/translated_site'.
    -l | --languages    Filter for the specific languages to be translated. When specified, 
                          only the language specific subfolders are generated.
    -c | --credentials  Path to the location for the Google API Credentials json file.
    -y | --yes          Overrides the user confirmation request to Y.
    -v | --version      The version number of the locale file. Defaults to '2'.
    -p | --port         The port number to serve the site on. Defaults to '8000'.
    -t | --tag          Name for the rosey tag used on the HTML. Defaults to 'data-rosey'.
    --locale-source     The source folder to read the translated json files. Defaults to 'rosey/locales'.
    --locale-dest       The destination folder to output the generated 'source.json' file. Defaults to 'rosey'.
    --default-language  The default language for the site (i.e. the language of 'source.json'). Defaults to 'en'.
    --source-delimiter  The character that should be used to format the 'source.json' file. Defaults to '\\t'.

Commands:
    --Command--                                                         --Reqd flags--
    generate        Generates a lookup table for the marked keys.
    check           Generates a comparison between source and 
                      locales files.
    convert         Generate the version 2 equivalent files from the
                      current locales files.
    build           Generates a translated version of your website
                      to the dest folder.
    clean           Removes all files from the dest folder.
    base            Copy assets and creates the redirect page.
                      Use 'translate' to generate the translated
                      websites
    translate       Generates a translated version of the websites      --languages
                      for the specified languages only.
    serve           Runs a local webserver on the dest folder.
    watch           Watches the dest folder and reload the local 
                      webserver.
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
				alias: 's'
			},
			dest: {
				type: 'string',
				alias: 'd'
			},
			languages: {
				type: 'string',
				alias: 'l'
			},
			'default-language': {
				type: 'string',
				alias: null
			},
			'locale-source': {
				type: 'string',
				alias: null
			},
			'locale-dest': {
				type: 'string',
				alias: null
			},
			'source-delimeter': {
				type: 'string',
				alias: null
			},
			credentials: {
				type: 'string',
				alias: 'c'
			},
			tag: {
				type: 'string',
				alias: null
			},
			port: {
				type: 'string',
				alias: 'p'
			},
			version: {
				type: 'number',
				alias: 'v'
			},
			yes: {
				type: 'boolean',
				alias: 'y'
			}
		}
	}
);

/**
 * Passes inputs to cli.js
 */
async function run() {
	const exitCode = await cli.run(inputs);
	if (exitCode) process.exit(exitCode);
}
run();
