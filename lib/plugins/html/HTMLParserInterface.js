const PluginError = require('plugin-error');
const fs = require('fs');
const c = require('ansi-colors');
const through = require('through2').obj;
const log = require('fancy-log');
const cheerio = require('cheerio');
const crypto = require('crypto');
const path = require('path');

// const REDIRECT_HTML = fs.readFileSync(`${__dirname}/redirect-page.html`, 'utf8');
const IGNORE_URL_REGEX = /^([a-z]+:|\/\/|#)/;

function NotYetImplemented(name) {
	throw new Error(`${name} - Not Yet Implemented`);
}

function getBaseFolder(sitePath) {
	return sitePath.replace(/^\/+/, '').split(path.sep).shift();
}

function generateDefaultI18nKey($, $el) {
	const outerHTML = $.html($el);
	return crypto.createHash('sha256').update(outerHTML).digest('base64').replace(/=+$/, '');
}

function returnNamespace($el, parser) {
	let namespace = $el.parents(`[${parser.options.rosey.data_tag}-root]`).attr(`${parser.options.rosey.data_tag}-root`);
	if (namespace !== '') { // Used to clean any other namespace previously
		if (namespace) {
			namespace += ':';
		} else {
			const parentNamespaces = $el.parents(`[${parser.options.rosey.data_tag}-ns]`);
			if (parentNamespaces) {
				namespace = '';
				for (let i = parentNamespaces.length - 1; i >= 0; i -= 1) {
					const ns = parentNamespaces[i].attribs[`${parser.options.rosey.data_tag}-ns`];
					namespace = `${namespace}${ns}:`;
				}
			}
		}
	}
	return namespace;
}

function handleHTMLFile(parser) {
	return through(function transform(file, encoding, callback) {
		if (file.isNull()) {
			return callback(null, file);
		}
		if (file.isStream()) {
			return callback(new PluginError('local-ejs', 'Streaming not supported'));
		}

		file.sitePath = `/${file.path.substring(file.base.length)}`;
		file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

		if (parser.skipFile && parser.skipFile(file)) {
			return callback();
		}

		const $ = cheerio.load(file.contents.toString(encoding),
			{
				_useHtmlParser2: true,
				lowerCaseAttributeNames: false,
				decodeEntities: false
			});

		$(`[${parser.options.rosey.data_tag}]`).each(function processElement() {
			const $el = $(this);
			let key = $el.attr(parser.options.rosey.data_tag);
			const namespace = returnNamespace($el, parser);

			let attributes = $el.attr(`${parser.options.rosey.data_tag}-attrs`);
			if (!key) {
				key = generateDefaultI18nKey($, $el);
			}
			if (namespace) {
				key = `${namespace}${key}`;
			}
			attributes = attributes ? attributes.split(',') : [];
			attributes.map((attr) => attr.trim());

			parser.processElement.apply(parser, [file, $el, key, attributes]);
		});

		// Run through all the orphan attr tags
		// expected object
		// {
		//   "attribute Name": "Key to be exported ",
		//   "content": 'meta-title'
		// }
		$(`[${parser.options.rosey.data_tag}-attrs-explicit]`).each(function processExplicitAttr() {
			const $el = $(this);
			const attrStr = $el.attr(`${parser.options.rosey.data_tag}-attrs-explicit`);
			const namespace = returnNamespace($el, parser);
			const explicit = JSON.parse(attrStr);

			parser.processExplicitAttr.apply(parser, [file, $el, explicit, namespace]);
		});

		if (parser.rewriteLinks) {
			$('a[href]:not([preserve-link]), link[href]:not([preserve-link])').each(function processLink() {
				const $el = $(this);
				const href = $el.attr('href');
				const updated = href && parser.rewriteLinks.apply(this, [file, href]);

				if (updated) {
					$el.attr('href', updated);
				}
			});
			$("meta[http-equiv='refresh']").each(function processLink() {
				const $el = $(this);
				const content = $el.attr('content');
				const parts = content.split(';');

				for (let i = 0; i < parts.length; i += 1) {
					if (parts[i].toLowerCase().indexOf('url=') === 0) {
						const href = parts[i].substring(4);
						const updated = parser.rewriteLinks.apply(this, [file, href]);

						if (updated) {
							parts[i] = `url=${updated}`;
							$el.attr('content', parts.join(';'));
						}
						return;
					}
				}
			});
		}

		if (parser.completeFile) {
			parser.completeFile.apply(this, [file, $]);
		}

		return callback();
	});
}

module.exports = class HTMLParserInterface {
	constructor(options) {
		this.options = options;
	}

	// eslint-disable-next-line class-methods-use-this
	processFile() {
		return handleHTMLFile(this);
	}

	// eslint-disable-next-line class-methods-use-this
	complete() {
		NotYetImplemented('processElement');
	}

	// eslint-disable-next-line class-methods-use-this
	processElement() {
		NotYetImplemented('processElement');
	}
};
