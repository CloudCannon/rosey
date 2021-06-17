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
		it('should return with the correct flags set', async () => {
			const options = cli.setOptions({ flags: flags });
			expect(options.rosey.dest).to.equal('testdest');

			expect(options.flags.yes).to.equal(true);
			expect(options.serve.port).to.equal(9000);
		});
	});
	context('Receives a string as a port number from cli', () => {
		const flags = { port: 'NotAPortNumber' };
		it('should revert to default port number', async () => {
			const options = cli.setOptions({ flags: flags });
			expect(options.serve.port).to.equal(8000);
		});
	});
	context('Receives an incorrect port number from cli', () => {
		const flags = { port: '999' };
		it('should revert to default port number', async () => {
			const options = cli.setOptions({ flags: flags });
			expect(options.serve.port).to.equal(8000);
		});
	});
	context('Receives default options', () => {
		const flags = {};
		it('should return with the correct default settings', async () => {
			const options = cli.setOptions({ flags: flags, help: 'helpMessage' });
			expect(options.cwd).to.equal(process.cwd());
			expect(options.help).to.equal('helpMessage');
		});
	});
});

describe('run()', () => {
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
});
