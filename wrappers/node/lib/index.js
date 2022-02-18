#!/usr/bin/env node
const path = require('path');
const { execFileSync } = require('child_process');

execFileSync(
    path.join(__dirname, `../bin/rosey${process.platform === 'win32' ? '.exe' : ''}`),
    process.argv.slice(2),
    {
        stdio: [process.stdin, process.stdout, process.stderr]
    }
)