const through = require('through2').obj;
const fs = require('fs').promises;
const jsonPointer = require('json-pointer');
const c = require('ansi-colors');
const log = require('fancy-log');

const REGEX_NUMBERS = /^\d+$/;

function iterate(obj, schema, pointer, schemaPointer, ns, parser, file) {
	let namespace = ns;
	const { separator } = parser.options.rosey;
	Object.keys(obj).forEach((element) => {
		const schemaElement = REGEX_NUMBERS.test(element) ? '0' : element;
		const tmpPointer = `${pointer}/${element}`;
		const tmpSchemaPointer = `${schemaPointer}/${schemaElement}`;
		if (typeof obj[element] === 'object') {
			iterate(obj[element], schema, tmpPointer, tmpSchemaPointer, namespace, parser, file);
		} else {
			try {
				const schemaDefinitions = jsonPointer.get(schema, tmpSchemaPointer);

				if (schemaDefinitions) {
					const schemaParts = schemaDefinitions.split(separator);
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
							obj[element] = parser.processElement(localeKey.toLowerCase(), obj[element], file);
							break;
						default:
							break;
						}
					});
				}
			} catch (error) {
				// Ignored.
				log(error);
			}
		}
	});
}

function handleFile(parser) {
	return through(async function transform(file, encoding, callback) {
		if (file.isNull()) {
			return callback(null, file);
		}

		if (parser.skipFile && parser.skipFile(file)) {
			return callback();
		}

		file.sitePath = `/${file.path.substring(file.base.length)}`;
		file.sitePath = file.sitePath.replace(/\/index.html?/i, '/').replace(/\/+/i, '/');

		if (file.sitePath.indexOf('.rosey.json') > 0) {
			return callback(null);
		}
		const schemaFile = file.base + file.sitePath.replace('.json', '.rosey.json');

		let schemaContent = {};
		let schemaFound = false;
		try {
			await fs.stat(schemaFile);
			schemaContent = JSON.parse(await fs.readFile(schemaFile, { encoding: 'utf-8' }));
			schemaFound = true;
		} catch (error) {
			log(c.yellow(`Schema file not found: ${c.blue(schemaFile)}`));
			schemaFound = false;
		}

		const fileContent = file.contents.toString(encoding);
		const content = JSON.parse(fileContent);
		if (fileContent && schemaFound) {
			iterate(content, schemaContent, '', '', '', parser, file);
		}

		if (parser.completeFile) {
			parser.completeFile.apply(parser, [file, JSON.stringify(content, null, 2), this]);
		}

		return callback();
	});
}

module.exports = class JsonParserInterface {
	constructor(options) {
		this.options = options;
	}

	// eslint-disable-next-line class-methods-use-this
	processFile() {
		return handleFile(this);
	}
};
