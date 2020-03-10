const cli = require("../cli.js");
let expect = require('chai').expect;


describe("checkRequiredFlags()", function() {
    context ("User misses required flag", function() {
        it("Should return false", async function() {
            expect(cli.checkRequiredFlags({}, ["baseurl"])).to.equal(false);
        })
    }) 

    context ("User supplies correct flag", function() {
        it("Should return true", async function() {
            expect(cli.checkRequiredFlags({baseurl: "test"}, ["baseurl"])).to.equal(true);
        })
    }) 
})

describe("setOptions()", function() {
    context ("Receives flags from cli", function() {
        let flags = {"dest": "testdest", "overwrite": true}
        it ("should return with the correct flags set", function() {
            let options = cli.setOptions( {flags} );
            expect(options.i18n.dest).to.equal("testdest");

            expect(options.flags.overwrite).to.equal(true);
        })
    })
    context ("Receives default options", function() {
        let flags = {}
        it ("should return with the correct default settings", function() {

            let options = cli.setOptions( {flags, help:"helpMessage"} );
            expect(options.cwd).to.equal(process.cwd());
            expect(options.help).to.equal("helpMessage");
        })
    })
})

describe("run()", function() {
    // before(function(){
    //     fs.mkdirSync("test/forTesting");
    //     fs.writeFileSync("test/forTesting/image.jpg", "image");
    // })
    context ("User enters invalid command", function() {
        let inputs = {flags: {}, input: ["invalidcommand"]}
        it ("Should exit with code 1", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(1);
        })
    })

    
    context ("User enters valid command", function() {
        
        let inputs = {flags: {}, input: ["help"]}
        it ("Should exit with code (0)", async function() {
            let exitCode = await cli.run( inputs );
            expect(exitCode).to.equal(0);
        })
    })
    
    // context ("Command runs but fails", function() {
    //     let inputs = {flags: {"baseurl": "test", "source": "test/invalidplace", "dest": "test/forTesting"}, input: ["clone-assets"]}
    //     it("Should exit with code (1)", async function() {
    //         let exitCode = await cli.run( inputs );
    //         expect(exitCode).to.equal(1);
    //     })
    // })

    // context ("User misses required flag", function() {
    //     let inputs = {flags: {}, input: ["build"]}
    //     it ("Should exit with code 1", async function() {
    //         let exitCode = await cli.run( inputs );
    //         expect(exitCode).to.equal(1);
    //     })
    // })

    // after(function(){
    //     fs.removeSync("test/forTesting")
    // })
})