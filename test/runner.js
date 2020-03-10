const runner = require("../lib/runner.js");
const path = require("path");
const chai = require("chai");
let expect = require('chai').expect;
const fs = require("fs-extra");

let dest = "test/testdir"

let options = {
    cwd: "/",

    i18n: {
        src: "test/src",
        dest: "test/dest"
    },
    flags: {
        overwrite: true
    }               
};
// TESTOP IS NEVER CHANGED
let testOp = {
    cwd: "/",

    dist: {
        src: "test/src",
        dest: "test/dest"
    },
    flags: {
        overwrite: true
    }            
};

describe("_askYesNo", function() {
    context("Response is affirmative", function(){
        it("should return true", async function(){
            let response = await runner._askYesNo("question", "Y");
            expect(response).to.equal(true);
        })
    })

    context("Response is negative", function(){
        it("should return false", async function(){
            let response = await runner._askYesNo("question", "N");
            expect(response).to.equal(false);
        })
    })
})

describe ("clean", async function() {
    before(function () {
        fs.mkdirSync(dest);
    })

    await context ("Removing a file", function(){
        it("should remove the directory", async function () {
            options.i18n.dest = dest;
            let res = await runner.clean( options )
            console.log(res);
            expect(res).to.eql([path.resolve(options.i18n.dest)]);
        })
    })

    
    await context ("invalid directory name", function(){
        options.i18n.dest = "thisdoesntexist"
        it("should return an empty array", async function () {
            let res = await runner.clean( options )
            expect(res).to.eql([]);
        })
    })

    
    after(function () {
        fs.removeSync("test/testdir", {recursive: true})
    })
    
})
