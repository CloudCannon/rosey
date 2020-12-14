const vfs = require('vinyl-fs');
const JsonParserInterface = require('./JsonParserInterface');

module.exports = class JsonGenerator extends JsonParserInterface {
	constructor(options) {
		super(options);
		this.locale = {};
		this.complete = true;
	}

	readFiles() {
		return new Promise((resolve) => {
			vfs.src([`${this.options.rosey.full_source}/**/*.json`])
				.pipe(this.processFile())
				.pipe(vfs.dest(this.options.rosey.full_generated_locale_dest_path, { overwrite: true }))
				.on('end', resolve);
		});
	}

	addLocale(key, value, file) {
		if (!this.locale[key]) {
			this.locale[key] = {
				original: value,
				pages: {},
				total: 0
			};
		} else if (this.locale[key].original !== value) {
			console.log(`${'Duplicate & mismatched'} ${key}`);
		}

		const filePath = file.path.substring(file.base.length);
		if (!this.locale[key].pages[filePath]) {
			this.locale[key].pages[filePath] = 1;
		} else {
			this.locale[key].pages[filePath] += 1;
		}

		this.locale[key].total += 1;
	}

	processElement(key, value, file) {
		this.addLocale(key, value, file);
		return value;
	}
};
