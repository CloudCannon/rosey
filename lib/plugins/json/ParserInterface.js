const through = require('through2').obj;
const fs = require('fs').promises;
const jsonPointer = require('json-pointer');
const Vinyl = require('vinyl');
const c = require('ansi-colors');
const log = require('fancy-log');

function NotYetImplemented(name) {
	throw new Error(`${name} - Not Yet Implemented`);
}

const REGEX_NUMBERS = /^\d+$/;

function cleanObj(obj) {
	Object.keys(obj).forEach((prop) => {
		if (!obj[prop]) {
			delete obj[prop];
		}
	});
}

function iterate(obj, schema, pointer, schemaPointer, ns, parser, file) {
	let namespace = ns;
	Object.keys(obj).forEach((element) => {
		const schemaElement = REGEX_NUMBERS.test(element) ? '0' : element;
		const tmpPointer = `${pointer}/${element}`;
		const tmpSchemaPointer = `${schemaPointer}/${schemaElement}`;
		if (typeof obj[element] === 'object') {
			iterate(obj[element], schema, tmpPointer, tmpSchemaPointer, namespace, parser, file);
		} else {
			try {
				const schemaDefinitions = jsonPointer.get(schema, (tmpSchemaPointer));

				if (schemaDefinitions) {
					const schemaParts = schemaDefinitions.split(':');
					const roseyTags = schemaParts[0];
					const tagName = schemaParts[1];
					const splitRoseyTags = roseyTags.split('|');
					let localeKey = '';
					let localNamespace = '';

					Object.keys(splitRoseyTags).forEach((i) => {
						switch (splitRoseyTags[i]) {
						case 'rosey-ns':
							namespace += `${obj[element]}.`; // Uses the value of the element as the namespace.
							break;
						case 'rosey-array-ns':
							localNamespace = `${obj[element]}.`; // Uses the value of the element as the local namespace.
							break;
						case 'rosey':
							localeKey += namespace + localNamespace + tagName;
							parser.processElement(localeKey.toLowerCase(), obj[element], file);
							break;
						default:
							break;
						}
					});
				}
			} catch (error) {
				// Ignored.
				console.log(error);
			}
		}
	});
}

function handleFile(parser) {
	return through(async function transform(file, encoding, callback) {
		if (file.isNull()) {
			return callback(null, file);
		}

		file.sitePath = `/${file.path.substring(file.base.length)}`;
		file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

		if (file.sitePath.indexOf('.rosey.json') > 0) {
			return callback(null);
		}
		const schemaFile = file.base + file.sitePath.replace('.json', '.rosey.json');

		await fs.stat(schemaFile)
			.catch((err) => {
				log(c.red(`Schema file not found: ${schemaFile}`));
				return callback(err);
			});

		const schemaContent = JSON.parse(await fs.readFile(schemaFile, { encoding: 'utf-8' }));

		if (parser.skipFile && parser.skipFile(file)) {
			return callback();
		}
		const fileContent = file.contents.toString(encoding);
		if (fileContent) {
			const content = JSON.parse(fileContent);
			iterate(content, schemaContent, '', '', '', parser, file);
		}

		if (parser.complete) {
			cleanObj(parser.locales);
			const keys = Object.keys(parser.locales);

			const contents = {
				version: 2,
				keys: parser.locales
			};

			this.push(new Vinyl({
				path: parser.options.rosey.generated_locale_dest_file,
				contents: Buffer.from(JSON.stringify(contents, null, parser.options.rosey.source_delimeter || ''))
			}));

			log(`${c.green('Generation complete')} ${
				c.blue(parser.options.rosey.generated_locale_dest_file)
			} available with ${keys.length} keys`);
		}

		return callback();
	});
}

module.exports = class ParserInterface {
	constructor(options) {
		this.options = options;
	}

	// eslint-disable-next-line class-methods-use-this
	processFile() {
		return handleFile(this);
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
