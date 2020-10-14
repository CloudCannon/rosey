const vfs = require('vinyl-fs');
const c = require('ansi-colors');
const log = require('fancy-log');
const HTMLParserInterface = require('./HTMLParserInterface');

module.exports = class HTMLGenerator extends HTMLParserInterface {
	constructor(options) {
		options = options || { version: 2 };
		super(options);
		this.locale = {};
		this.complete = true;
	}

	readFiles() {
		return new Promise((resolve) => {
			vfs.src([`${this.options.rosey.full_source}/**/*.html`])
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
		} else if (this.locale[key].original !== value
				&& this.options.rosey.show_duplicate_locale_warnings) {
			log(`${c.yellow(`Duplicate & mismatched ${this.options.rosey.data_tag}`)} ${c.grey(key)}`);
		}

		const filePath = file.path.substring(file.base.length);
		if (!this.locale[key].pages[filePath]) {
			this.locale[key].pages[filePath] = 1;
		} else {
			this.locale[key].pages[filePath] += 1;
		}

		this.locale[key].total += 1;
	}

	// eslint-disable-next-line class-methods-use-this
	processElement(file, $el, key, attributes) {
		this.addLocale(key, $el.html(), file);
		attributes.forEach((attr) => {
			this.addLocale(`${key}.${attr}`, $el.attr(attr) || '', file);
		});
	}

	// eslint-disable-next-line class-methods-use-this
	processExplicitAttr(file, $el, explicit, namespace) {
		Object.keys(explicit).forEach((attr) => {
			const key = namespace ? `${namespace}${explicit[attr]}` : explicit[attr];
			this.addLocale(key, $el.attr(attr), file);
		});
	}
};
