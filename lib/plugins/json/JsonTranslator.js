const c = require('ansi-colors');
const log = require('fancy-log');
const path = require('path');
const rename = require('gulp-rename');
const vfs = require('vinyl-fs');

const JsonParserInterface = require('./JsonParserInterface');

module.exports = class JsonTranslator extends JsonParserInterface {
	constructor(options) {
		options = options || { version: 2 };
		super(options);
		this.targetLocale = options.targetLocale;
		this.locale = options.locale;
		this.localeNames = options.localeNames;

		this.localeLookup = {};
		for (let i = 0; i < this.localeNames.length; i += 1) {
			this.localeLookup[this.localeNames[i]] = true;
		}
		this.complete = true;
	}

	translateFiles() {
		return new Promise((resolve) => {
			this.options.addOtherLocaleAlternates = true;
			vfs.src([`${this.options.rosey.full_source}/**/*.json`])
				.pipe(this.processFile())
				.pipe(rename((parsedPath) => {
					parsedPath.dirname = parsedPath.dirname.replace(/^\/+/, '') || '.';
				}))
				.pipe(vfs.dest(path.join(this.options.rosey.dest, this.options.targetLocale)))
				.on('end', resolve);
		});
	}

	processElement(key, value, file) {
		if (!this.locale) {
			return value; // Default locale case
		}
		let translatedValue = value;
		if (this.locale[key]) {
			let { translation } = this.locale[key];
			if (typeof translation === 'object') {
				// Version 2
				translation = translation.value;
			}
			translatedValue = this.locale[key].wrappedTranslation || translation;
			this.locale[key].count += 1;
		} else if (value && this.options.rosey.show_missing_locale_warnings) {
			log(`${c.yellow('Missing translation')} ${
				c.grey(this.targetLocale + file.sitePath)
			} [${this.options.rosey.data_tag}=${key}]`);
		}

		return translatedValue;
	}

	// eslint-disable-next-line class-methods-use-this
	completeFile(file, obj, through) {
		file.contents = Buffer.from(obj);
		through.push(file);
	}
};
