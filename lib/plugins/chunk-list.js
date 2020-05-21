const Chunk = require('./chunk');

module.exports = function ChunkList(chunkArray) {
	this.list = [];
	if (chunkArray) {
		this.list.concat(chunkArray);
	}

	this.push = function push(chunk) {
		this.list.push(chunk);
	};
	this.concat = function concat(chunk) {
		this.list.concat(chunk);
	};

	this.resolveDependencies = function resolveDependencies() {
		this.concatenateInner(true);
		this.concatenateInner(false);
		this.insertBreaklines();
	};

	this.insertBreaklines = function insertBreaklines() {
		/* Insert a breakline instead of a trailing space if a chunk is CJK. */
		const targetChunks = new ChunkList();
		this.list.forEach((chunk) => {
			const lastChar = chunk.word[chunk.word.length - 1];
			if (lastChar === ' ' && chunk.hasCJK()) {
				chunk.word = chunk.word.substring(0, chunk.word.length - 1);
				targetChunks.push(chunk);
				targetChunks.push(new Chunk('\n', 'BREAK'));
			} else {
				targetChunks.push(chunk);
			}
		});
		this.list = targetChunks.list;
	};

	this.concatenateInner = function concatenateInner(direction) {
		/**
         * Concatenate chunks based on each chunk's dependency.
         * direction (bool): Direction of concatenation process (true for forward)
         */
		let tempBucket = [];
		const sourceChunks = direction ? this.list : this.list.reverse();
		let targetChunks = [];

		for (let index = 0; index < sourceChunks.length; index += 1) {
			const chunk = sourceChunks[index];
			// if the chunk has matched dependency, do concatenation
			// is the chunk is a space, concatenate to the previous chunk
			if (chunk.dependency === direction || (!direction && chunk.isSpace())) {
				tempBucket.push(chunk);
			} else {
				tempBucket.push(chunk);
				if (!direction) {
					tempBucket = tempBucket.reverse();
				}
				let newWord = '';
				tempBucket.forEach((c) => {
					newWord += c.word;
				});
				targetChunks.push(new Chunk(newWord, chunk.pos, chunk.label, chunk.dependency));
				tempBucket = [];
			}
		}
		if (tempBucket.length > 0) {
			targetChunks = targetChunks.concat(tempBucket);
		}
		if (!direction) {
			targetChunks = targetChunks.reverse();
		}
		this.list = targetChunks;
	};

	this.htmlSerialize = function htmlSerialize(attributes, maxLength) {
		/**
         * Returns concatenated HTML code with SPAN tag.
         * attributes (JSON): map of name-value pairs for attributes of output span tags
         * maxLength (int, optional): max length of span enclosed chunk
         */
		const elements = [];
		this.list.forEach((chunk) => {
			if (chunk.hasCJK() && !(maxLength && chunk.word.length > maxLength)) {
				let attributeString = '';
				Object.keys(attributes).forEach((key) => {
					attributeString += ` ${key}="${attributes[key]}"`;
				});
				elements.push(`<span${attributeString}>${chunk.word}</span>`);
			} else {
				// add word without span tag for non-CJK text by appending it after the last element
				elements.push(chunk.word);
			}
		});

		return elements.join('');
	};
};
