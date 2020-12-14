const vfs = require('vinyl-fs');
const c = require('ansi-colors');
const log = require('fancy-log');
const path = require('path');
const rename = require('gulp-rename');

const HTMLParserInterface = require('./HTMLParserInterface');

const IGNORE_URL_REGEX = /^([a-z]+:|\/\/|#)/;

function getBaseFolder(sitePath) {
	return sitePath.replace(/^\/+/, '').split(path.sep).shift();
}

module.exports = class HTMLTranslator extends HTMLParserInterface {
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
	}

	translateFiles() {
		return new Promise((resolve) => {
			this.options.addOtherLocaleAlternates = true;
			vfs.src(`${this.options.rosey.full_source}/**/*.html`)
				.pipe(this.processFile())
				.pipe(rename((parsedPath) => {
					parsedPath.dirname = parsedPath.dirname.replace(/^\/+/, '') || '.';
				}))
				.pipe(vfs.dest(path.join(this.options.rosey.dest, this.options.targetLocale)))
				.on('end', resolve);
		});
	}

	clonePrelocalisedHtmlPages(next) {
		this.options.addOtherLocaleAlternates = false;
		vfs.src(`${this.options.rosey.full_source}/${this.options.targetLocale}/**/*.html`)
			.pipe(this.processFile())
			.pipe(vfs.dest(path.join(this.options.rosey.dest, this.options.targetLocale)))
			.on('end', next);
	}

	skipFile(file) {
		const baseFolder = getBaseFolder(file.sitePath);
		const skip = !!this.localeLookup[baseFolder];
		if (skip && this.options.rosey.show_skipped_updates) {
			log(`Skipping HTML ${c.grey(`'${file.sitePath}'`)}`);
		}
		return skip;
	}

	rewriteLinks(file, href) {
		if (!href || IGNORE_URL_REGEX.test(href)) {
			return null;
		}

		const baseFolder = getBaseFolder(href);
		if (this.localeLookup[baseFolder]) {
			if (this.options.rosey.show_skipped_updates) {
				log(`Skipping link ${c.grey(`'${href}'`)}`);
			}
			return null;
		}

		const parsed = path.parse(href);

		if (parsed.ext && parsed.ext.indexOf('.htm') !== 0) {
			return null;
		}

		const parts = href.replace(/^\/+/, '').split('/');
		parts.unshift(this.targetLocale);

		const updated = `/${parts.join('/')}`;
		return updated.replace(/\/+/g, '/');
	}

	processElement(file, $el, key, attributes) {
		if (!this.locale) {
			return; // Default locale case
		}

		if (this.locale[key]) {
			let { translation } = this.locale[key];
			if (typeof translation === 'object') {
				// Version 2
				translation = translation.value;
			}
			$el.html(this.locale[key].wrappedTranslation || translation);
			this.locale[key].count += 1;
		} else if ($el.html() && this.options.rosey.show_missing_locale_warnings) {
			log(`${c.yellow('Missing translation')} ${
				c.grey(this.targetLocale + file.sitePath)
			} [${this.options.rosey.data_tag}=${key}]`);
		}

		attributes.forEach((attr) => {
			if (this.locale[`${key}.${attr}`]) {
				let { translation } = this.locale[`${key}.${attr}`];
				if (typeof translation === 'object') {
					// Version 2
					translation = translation.value;
				}
				$el.attr(attr, translation);
				this.locale[`${key}.${attr}`].count += 1;
			} else if ($el.attr(attr) && this.options.rosey.show_missing_locale_warnings) {
				log(`${c.yellow('Missing translation')} ${
					c.grey(this.targetLocale + file.sitePath)
				} [${this.options.rosey.data_tag}=${key}][${attr}]`);
			}
		});
	}

	processExplicitAttr(file, $el, explicit, namespace) {
		if (!this.locale) {
			return; // Default this.locale case
		}

		Object.keys(explicit).forEach((attr) => {
			const key = namespace ? `${namespace}${explicit[attr]}` : explicit[attr];
			if (this.locale[key]) {
				let { translation } = this.locale[key];
				if (typeof translation === 'object') {
					// Version 2
					translation = translation.value;
				}
				$el.attr(attr, translation);
				this.locale[key].count += 1;
			} else if ($el.attr(attr) && this.options.rosey.show_missing_locale_warnings) {
				log(`${c.yellow('Missing translation')} ${
					c.grey(this.targetLocale + file.sitePath)
				} [${this.options.rosey.data_tag}=${key}]`);
			}
		});
	}

	completeFile(file, $, through) {
		$('html').attr('lang', this.targetLocale);
		$("meta[http-equiv='content-language']").remove();
		$('head').append(`<meta http-equiv="content-language" content="${this.targetLocale}">\n`);

		if (this.options.addOtherLocaleAlternates) {
			this.localeNames.forEach((localeName) => {
				if (localeName !== this.targetLocale) {
					const redirectUrl = localeName + file.sitePath;
					$('head').append(`<link rel="alternate" href="/${redirectUrl}" hreflang="${localeName}">\n`);
				}
			});
		}

		file.contents = Buffer.from($.html());
		through.push(file);
	}
};
