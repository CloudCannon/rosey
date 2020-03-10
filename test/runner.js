const runner = require("../lib/runner.js");
const path = require("path");
let expect = require('chai').expect;
const fs = require("fs-extra");

let dest = "test/testdir"

let options = {
    cwd: "/",

    i18n: {
        src: "test/src",
        dest: "test/dest",
        locale_src: "test/locales",
        full_locale_src: "test/locales"
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
        fs.mkdirSync(dest);//TODO: move to options variable
    })

    context("Removing a file", function () {
        it("should remove the directory", async function () {
            options.i18n.dest = dest;
            let res = await runner.clean(options);
            console.log(res);
            expect(res).to.eql([path.resolve(options.i18n.dest)]);
        });
    })

    
    context("invalid directory name", function () {
        options.i18n.dest = "thisdoesntexist";
        it("should return an empty array", async function () {
            let res = await runner.clean(options);
            expect(res).to.eql([]);
        });
    })

    
    after(function () {
        fs.removeSync(dest, {recursive: true})//TODO: move to options variable
    })
    
})

describe("_loadLocales", function() {
    before(function () {
        fs.mkdirSync(options.i18n.locale_src);
        locale = {
            "bottom-title": "Última tecnologia, ótimo desempenho",
            "contact-us": "Entre em contato"
        }
        fs.writeJSONSync(options.i18n.locale_src+"/pt-BR.json",locale)
        fs.writeFileSync(options.i18n.locale_src+"/pt-PT.json","Wrong Json")
    })

    context("Locale folder exists", function () {
        it("it should return no error", async function () {
            let response = await runner._loadLocales(options);
            console.log(response);
            expect(response).to.equal(undefined);
        });
    })
    
    // context("Locale file exists", function () {
    //     it("it should return no error", async function () {
    //         let response = await runner._loadLocales(options);
    //         console.log(response);
    //         expect(response).to.equal(null);//TODO
    //     });
    // })

    
    // context("Locale file exists but is malformed", function () {
    //     it("it should return no error", async function () {
    //         let response = await runner._loadLocales(options);
    //         console.log(response);
    //         expect(response).to.equal(null);//TODO
    //     });
    // })

    
    // context("Locale folder doens't exists", function () {
    //     options.i18n.full_locale_src = "thisdoesntexist";
    //     it("it should return an error", async function () {
    //         let response = await runner._loadLocales(options);
    //         console.log(response);
    //         expect(response).to.equal(error);
    //     });
    // })

    after(function () {
        fs.removeSync(options.i18n.locale_src, {recursive: true})
    })

})
