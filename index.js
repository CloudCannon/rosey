#!/usr/bin/env node
const cli = require('./cli');
const meow = require('meow');
const helpString = `
Usage: i18n <command> [args]
Args:
    -s | --source       The source folder to clone. Defaults to dist/site.
    -d | --dest         The destination folder to clone the files to. Defaults to dist/translated_site
    -p | --port         The port number to serve the site on.
    -o | --override     Overrides the user convirmation request to Y

Commands:
    --Command--                                                     
    clean           Removes all files from the dest folder.            
    build           Generates a translated version of your website to the dest folder.
    serve           Runs a local webserver on the dest folder.
    watch           Watches the dest folder and reload the local webserver.
    wrapCharacters  Creates a new locale for Japanese translations at i18n/wrapped/.
`


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
        port: {
            type: 'string',
            alias: 'p'
        },
        overwrite: {
            type: 'boolean',
            alias: 'o'
        }
    }
});

/**
 * Passes inputs to cli.js
 */
async function run(){
    
    const exitCode = await cli.run( inputs );
    console.log("exit code: " + exitCode);
    if (exitCode) process.exit(exitCode);
}
run();


