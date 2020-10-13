const async = require('async');
const googleLanguage = require('@google-cloud/language');
const Chunk = require('./chunk');
const ChunkList = require('./chunk-list');

const supportedLanguages = [
	'ja', 'ja-jp', 'ja_jp', 'ko', 'zh', 'zh-TW', 'zh-CN', 'zh-HK', 'zh-Hant'
];

module.exports = {
	parse: async function (options, callback) {
		if (!this.isLanguageSupported(options.language)) {
			return callback(new Error(`Language ${options.language} is not supported`));
		}

		const client = new googleLanguage.LanguageServiceClient({ keyFile: options.pathToCredentials });
		const splitedHTML = options.text.split('<br>');
		const parsed = [];
		await async.eachLimit(splitedHTML, 1, (text, next) => {
			this.segment(text, options.language, client).then((chunks) => {
				const htmlString = chunks.htmlSerialize(options.attributes, options.maxLength);
				parsed.push(htmlString);
				return next();
			});
		});
		return callback(null, parsed.join('<br>'));
	},

	isLanguageSupported: function (language) {
		return language && supportedLanguages.includes(language);
	},

	segment: function (text, language, client) {
		return this.getSourceChunks(text, language, client).then((source) => {
			source.chunks.resolveDependencies();
			return source.chunks;
		});
	},

	getSourceChunks: function (text, language, client) {
		return this.getAnnotations(text, language, client).then((results) => {
			const annotations = results[0];

			// list of labels dependent on other parts (subset of DependencyEdge.label enum)
			const dependentLabels = ['P', 'SNUM', 'PRT', 'AUX', 'SUFF', 'AUXPASS', 'RDROP', 'NUMBER', 'NUM', 'PREF'];
			const chunkList = new ChunkList();
			let seek = 0;

			for (let index = 0; index < annotations.tokens.length; index += 1) {
				const token = annotations.tokens[index];
				const word = token.text.content;
				const { beginOffset } = token.text;
				const { label } = token.dependencyEdge;
				const pos = token.partOfSpeech.tag;
				if (beginOffset > seek) {
					chunkList.push(new Chunk(' ', 'SPACE'));
					seek = beginOffset;
				}
				const chunk = new Chunk(word, pos, label);
				if (dependentLabels.includes(chunk.label)) {
					// determining concatenating direction based on syntax dependency
					chunk.dependency = index < token.dependencyEdge.headTokenIndex;
				}
				if (chunk.isPunctuation()) {
					chunk.dependency = chunk.isOpenPunctuation();
				}
				chunkList.push(chunk);
				seek += word.length;
			}

			return {
				chunks: chunkList,
				language: annotations.language
			};
		});
	},

	getAnnotations: function (text, language, client) {
		/* Returns JSON data of annotations retrieved from the given text. */
		const requestBody = {
			document: {
				type: 'PLAIN_TEXT',
				content: text
			},
			encodingType: 'UTF32'
		};

		if (language) {
			requestBody.document.language = language;
		}

		return this.callClientApi(requestBody, client);
	},

	callClientApi: function (requestBody, client) {
		return client.analyzeSyntax(requestBody);
	}

};
