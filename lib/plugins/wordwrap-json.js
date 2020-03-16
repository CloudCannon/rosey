const Chunk = require("./chunk");
const ChunkList = require("./chunk-list");
const language = require("@google-cloud/language");
const client = new language.LanguageServiceClient();

const supportedLanguages = [
    'ja', 'ko', 'zh', 'zh-TW', 'zh-CN', 'zh-HK', 'zh-Hant'
];

module.exports = {
    parse: function (options, callback) {
        if (!this.isLanguageSupported(options.language)) {
            return callback(new Error(`Language ${options.language} is not supported`));
        }
        
        return this.segment(options.text, options.language).then(chunks => {
            let htmlString = chunks.htmlSerialize(options.attributes, options.maxLength);

            callback(null, htmlString);
        });
    },

    isLanguageSupported: function (language) {
        return language && supportedLanguages.includes(language);
    },

    segment: function(text, language) {
        return this.getSourceChunks(text, language).then(source => {
            source.chunks.resolveDependencies();
            return source.chunks;
        });
    },

    getSourceChunks: function(text, language) {
        return this.getAnnotations(text, language).then(results => {
            
            let annotations = results[0];


            // list of labels dependent on other parts (subset of DependencyEdge.label enum)
            let dependentLabels = ['P', 'SNUM', 'PRT', 'AUX', 'SUFF', 'AUXPASS', 'RDROP', 'NUMBER', 'NUM', 'PREF'];
            let chunkList = new ChunkList();
            let seek = 0;

            for (let index=0; index < annotations.tokens.length; index++) {
                let token = annotations.tokens[index];
                let word = token.text.content;
                let beginOffset = token.text.beginOffset;
                let label = token.dependencyEdge.label;
                let pos = token.partOfSpeech.tag;
    
                if (beginOffset > seek) {
                    chunkList.push(new Chunk(" ", 'SPACE'));
                    seek = beginOffset;
                }
                let chunk = new Chunk(word, pos, label);
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
                "chunks": chunkList,
                "language": annotations.language
            };
        });
        
    },

    getAnnotations: function(text, language) {
        /* Returns JSON data of annotations retrieved from the given text. */
        let requestBody = {
            'document': {
                'type': 'PLAIN_TEXT',
                'content': text
            },
            'encodingType': 'UTF32'
        };

        if (language) {
            requestBody.document.language = language;
        }
        
        return this.callClientApi(requestBody);
    },

    callClientApi: function(requestBody){
        return client.analyzeSyntax(requestBody);
    }

};

