const unicodeData = require('unicharadata');

module.exports = function Chunk(word, POS /* part of speech */, label, dependency /* syntax info */) {
  this.word = word;
  this.POS = POS;
  this.label = label;
  this.dependency = dependency;

  this.isSpace = function () {
    return this.POS === 'SPACE' || this.word === ' ';
  };

  this.isPunctuation = function () {
    return this.word.length === 1 && unicodeData.category(this.word)[0] === 'P';
  };

  this.isOpenPunctuation = function () {
    // check if this is an opening bracket or quote mark
    return this.isPunctuation() && ['Ps', 'Pi'].includes(unicodeData.category(this.word));
  };

  this.hasCJK = function () {
    /* Check if the word has CJK characters. */
    const cjkCodepointRanges = [
      [4352, 4607], [11904, 42191], [43072, 43135],
      [44032, 55215], [63744, 64255], [65072, 65103],
      [65381, 65500], [131072, 196607],
    ];
    for (let i = 0; i < [...this.word].length; i++) {
      const character = [...this.word][i];
      for (let j = 0; j < cjkCodepointRanges.length; j++) {
        const range = cjkCodepointRanges[j];
        if (range[0] <= character.charCodeAt(0) && character.charCodeAt(0) <= range[1]) {
          return true;
        }
      }
    }
    return false;
  };
};
