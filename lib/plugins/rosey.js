const PluginError = require('plugin-error');
const fs = require('fs');
const through = require('through2').obj;

const path = require('path');

const REDIRECT_HTML = fs.readFileSync(`${__dirname}/redirect-page.html`, 'utf8');

function getBaseFolder(sitePath) {
	return sitePath.replace(/^\/+/, '').split(path.sep).shift();
}

module.exports = {

	redirectPage: function (options) {
		options = options || {};

		const { defaultLocale } = options;
		const { localeNames } = options;

		const localeLookup = {};
		for (let i = 0; i < localeNames.length; i += 1) {
			localeLookup[localeNames[i]] = true;
		}

		const redirectLookup = {};

		localeNames.forEach((localeName) => {
			const match = localeName.toLowerCase().match(/[a-z]+/gi);
			const language = match[0]; const
				country = match[1];

			redirectLookup[language] = localeName;
			if (country) {
				redirectLookup[`${language}-${country}`] = localeName;
				redirectLookup[`${language}_${country}`] = localeName;
			}

			redirectLookup[localeName] = localeName;
		});

		return through(function transform(file, encoding, callback) {
			if (file.isNull()) {
				return callback(null, file);
			}

			if (file.isStream()) {
				return callback(new PluginError('local-ejs', 'Streaming not supported'));
			}

			file.sitePath = `/${file.path.substring(file.base.length)}`;
			file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

			const baseFolder = getBaseFolder(file.sitePath);
			if (file.sitePath === '/404.html' || localeLookup[baseFolder]) {
				return callback();
			}

			const html = REDIRECT_HTML
				.replace(/ALTERNATES/g, localeNames.map((targetLocale) => {
					if (targetLocale !== defaultLocale) {
						return `<link rel="alternate" href="/${targetLocale}${file.sitePath}" hreflang="${targetLocale}">`;
					}
					return '';
				}).join(''))
				.replace(/SITE_PATH/g, file.sitePath)
				.replace(/DEFAULT_LANGUAGE/g, defaultLocale)
				.replace(/LOCALE_LOOKUP/g, JSON.stringify(redirectLookup));

			file.contents = Buffer.from(html);
			this.push(file);
			return callback();
		});
	}
};
