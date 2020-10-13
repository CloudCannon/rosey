const vfs = require('vinyl-fs');
const ParserInterface = require('./ParserInterface');

module.exports = class Generator extends ParserInterface {
	constructor(options) {
        super(options);
		this.locales = {};
	}

	readFiles() {
		console.log(`Scanning dir: ${this.options.rosey.full_source}`);

		return new Promise((resolve) => {
			vfs.src([`${this.options.rosey.full_source}/**/*.json`])
				.pipe(this.processFile())
				.pipe(vfs.dest(this.options.rosey.full_generated_locale_dest_path, {overwrite: true}))
				.on('end', resolve);
		});
	}

	addLocale(key, value, file) {
		if (!this.locales[key]) {
			this.locales[key] = {
				original: value,
                pages: {},
                total: 0
			};
		} else if (this.locales[key].original !== value) {
			console.log(`${`Duplicate & mismatched`} ${key}`);
		}
		//console.log(this.locales);
	
		const filePath = file.path.substring(file.base.length);
		if (!this.locales[key].pages[filePath]) {
		    this.locales[key].pages[filePath] = 1;
		} else {
		    this.locales[key].pages[filePath] += 1;
		}
	
		this.locales[key].total += 1;
    }

	processElement(key, value, file){
		this.addLocale(key, value, file);
	}
    
    complete() {
        return true;
    }
};
