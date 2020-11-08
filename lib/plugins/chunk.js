const unicodeData = require('unicharadata');

/**
 * Generates a comparison of rosey/source.json and rosey/locales/*.json at rosey/checks.json.
 * This is not run as part of the rosey command.
 *
 * @param {Object} word
 * @param {Object} POS part of speech
 * @param {Object} label
 * @param {Object} dependency syntax info
 */
module.exports = function Chunk(word, POS, label, dependency) {
	this.word = word;
	this.POS = POS;
	this.label = label;
	this.dependency = dependency;

	this.isSpace = function isSpace() {
		return this.POS === 'SPACE' || this.word === ' ';
	};

	this.isPunctuation = function isPunctuation() {
		return this.word.length === 1 && unicodeData.category(this.word)[0] === 'P';
	};

	this.isOpenPunctuation = function isOpenPunctuation() {
		// check if this is an opening bracket or quote mark
		return this.isPunctuation() && ['Ps', 'Pi'].includes(unicodeData.category(this.word));
	};

	this.hasCJK = function hasCJK() {
		/* Check if the word has CJK characters. */
		const cjkCodepointRanges = [
			[4352, 4607], [11904, 42191], [43072, 43135],
			[44032, 55215], [63744, 64255], [65072, 65103],
			[65381, 65500], [131072, 196607]
		];
		for (let i = 0; i < [...this.word].length; i += 1) {
			const character = [...this.word][i];
			for (let j = 0; j < cjkCodepointRanges.length; j += 1) {
				const range = cjkCodepointRanges[j];
				if (range[0] <= character.charCodeAt(0) && character.charCodeAt(0) <= range[1]) {
					return true;
				}
			}
		}
		return false;
	};
};
