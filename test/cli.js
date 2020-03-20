const { expect } = require('chai');
const cli = require('../cli.js');


describe('checkRequiredFlags()', () => {
  context('User misses required flag', () => {
    it('Should return false', async () => {
      expect(cli.checkRequiredFlags({}, ['dest'])).to.equal(false);
    });
  });

  context('User supplies correct flag', () => {
    it('Should return true', async () => {
      expect(cli.checkRequiredFlags({ dest: 'test' }, ['dest'])).to.equal(true);
    });
  });
});

describe('setOptions()', () => {
  context('Receives flags from cli', () => {
    const flags = { dest: 'testdest', yes: true, port: '9000' };
    it('should return with the correct flags set', () => {
      const options = cli.setOptions({ flags });
      expect(options.i18n.dest).to.equal('testdest');

      expect(options.flags.yes).to.equal(true);
      expect(options.serve.port).to.equal(9000);
    });
  });
  context('Receives a string as a port number from cli', () => {
    const flags = { port: 'NotAPortNumber' };
    it('should revert to default port number', () => {
      const options = cli.setOptions({ flags });
      expect(options.serve.port).to.equal(8000);
    });
  });
  context('Receives an incorrect port number from cli', () => {
    const flags = { port: '999' };
    it('should revert to default port number', () => {
      const options = cli.setOptions({ flags });
      expect(options.serve.port).to.equal(8000);
    });
  });
  context('Receives default options', () => {
    const flags = {};
    it('should return with the correct default settings', () => {
      const options = cli.setOptions({ flags, help: 'helpMessage' });
      expect(options.cwd).to.equal(process.cwd());
      expect(options.help).to.equal('helpMessage');
    });
  });
});

describe('run()', () => {
  // before(function(){
  //     fs.mkdirSync("test/forTesting");
  //     fs.writeFileSync("test/forTesting/image.jpg", "image");
  // })
  context('User enters invalid command', () => {
    const inputs = { flags: {}, input: ['invalidcommand'] };
    it('Should exit with code 1', async () => {
      const exitCode = await cli.run(inputs);
      expect(exitCode).to.equal(1);
    });
  });


  context('User enters valid command', () => {
    const inputs = { flags: {}, input: ['help'] };
    it('Should exit with code (0)', async () => {
      const exitCode = await cli.run(inputs);
      expect(exitCode).to.equal(0);
    });
  });

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
});
