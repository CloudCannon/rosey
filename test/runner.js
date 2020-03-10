const defaults = require("defaults");
const runner = require("../lib/runner.js");
const path = require("path");
let expect = require('chai').expect;
const fs = require("fs-extra");

let dest = "test/testdir"

let options = {
    cwd: "/",

    i18n: {
        source: "test/src",
        dest: "test/dest",
        locale_source: "test/locales",
        full_locale_source: "test/locales"
    },
    flags: {
        overwrite: true
    }               
};
modifiedOptions = {};
modifiedOptions = defaults(modifiedOptions, options);


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
        modifiedOptions.i18n.dest = "thisdoesntexist";
        it("should return an empty array", async function () {
            let res = await runner.clean(modifiedOptions);
            expect(res).to.eql([]);
        });
    })

    
    after(function () {
        fs.removeSync(dest, {recursive: true})//TODO: move to options variable
    })
    
})

describe("_loadLocales", function() {
    before(function () {
        fs.mkdirSync(options.i18n.locale_source);
        // locale = {
        //     "bottom-title": "Última tecnologia, ótimo desempenho",
        //     "contact-us": "Entre em contato"
        // }
        // fs.writeFileSync(options.i18n.locale_source+"/pt-PT.json","Wrong Json")
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
    //         fs.writeJsonSync(options.i18n.locale_source+"/pt-BR.json",locale)
    //         let response = await runner._loadLocales(options);
    //         console.log(response);
    //         //expect(response).to.equal(null);//TODO

    //         fs.remove(options.i18n.locale_source+"/pt-BR.json")
    //     });
    // })

    
    // context("Locale file exists but is malformed", function () {
    //     it("it should return no error", async function () {
    //         let response = await runner._loadLocales(options);
    //         console.log(response);
    //         expect(response).to.equal(null);//TODO
    //     });
    // })

    
    context("Locale folder doens't exists", function () {
        modifiedOptions.i18n.full_locale_source = "/thisdoesntexist";
        it("it should return an error", async function () {
            let response = await runner._loadLocales(modifiedOptions);
            console.log(response);
            expect(response).to.equal(undefined);
        });
    })

    after(function () {
        fs.removeSync(options.i18n.locale_source);
    })
 
})


describe("build", function() {
    before(function () {
        fs.mkdirSync(options.i18n.locale_source);
        locale = {
            "bottom-title": "Última tecnologia, ótimo desempenho",
            "contact-us": "Entre em contato"
        };
        fs.writeJsonSync(options.i18n.locale_source+"/pt-BR.json",locale);
        fs.writeFileSync(options.i18n.locale_source+"/pt-pt.json","Wrong JSON");
        fs.writeFileSync(options.i18n.locale_source+"/invalid.INVALID","Wrong JSON");
    })

    context ("building with valid configs", function(){
        it("should return 0", async function(){
            let res = await runner.build( options );
            
            expect(res).to.equal(0);
        })
    })

    after(function () {
        //fs.removeSync(options.i18n.locale_source+"/pt-BR.json");
        fs.remove(options.i18n.locale_source);
    })
 
})
