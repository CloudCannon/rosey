#!/usr/bin/env node
const cli = require('./cli');
const meow = require('meow');
const helpString = `
Usage: i18n <command> <flags>
Flags:

Commands:
    --Command--                                                     --Reqd flags--
    clean           Removes all files from the dest folder.            
`


/**
 * Takes input from user via command line and outputs an object containing
 * arguments (in camelCase) and flags.
 */
const inputs = meow(
    helpString, 
    {
    flags: {
        // source: { 
        //     type: 'string',
        //     alias: 's'
        // },
        // dest: {
        //     type: 'string',
        //     alias: 'd'
        // },
        // baseurl: {
        //     type: 'string',
        //     alias: 'b'
        // },
        // port: {
        //     type: 'string',
        //     alias: 'p'
        // },
        // overwrite: {
        //     type: 'boolean',
        //     alias: 'o'
        // },
        // split: {
        //     type: 'number',
        //     alias: null,
        //     default: 1
        // },
        // partition: {
        //     type: 'number',
        //     alias: null,
        //     default: 1
        // }
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


