const cli = require("../cli.js");
const runner = require("../lib/runner.js");
const wordwrap = require("../lib/plugins/wordwrap-json");

const defaults = require("defaults");
const chai = require('chai')
const spies = require('chai-spies');
const fs = require("fs-extra");
const path = require("path");

chai.use(spies);

const expect = chai.expect;

//Load default settings
let flags = {overwrite: true};
let options = cli.setOptions( {flags} );

//Modify paths for test purpose

let cwd = process.cwd();
let dest = "test/dest";
let source = "test/source";
let locale_source = "test/i18n/locale";
let generated_locale_dest = "test/i18n";
let legacy_path = "test/_locales";

options.i18n.dest = dest;
options.i18n.source = source;
options.i18n.locale_source = locale_source;
options.i18n.generated_locale_dest = generated_locale_dest;
options.i18n.legacy_path = legacy_path;

options.i18n.full_dest = path.join(cwd, dest);
options.i18n.full_source = path.join(cwd, source);
options.i18n.full_locale_source = path.join(cwd, locale_source);
options.i18n.full_generated_locale_dest = path.join(cwd, generated_locale_dest);
options.i18n.full_legacy_path = path.join(cwd, legacy_path);


modifiedOptions = {};
modifiedOptions = defaults(modifiedOptions, options);

function original () {
    // do something cool
  }

describe("_askYesNo", function() {
    context("Response is affirmative", function(){
        it("should return true", async function(){
            let response = await runner._askYesNo("question", "Y");
            expect(response).to.equal(true);
        })
    })

    context("Response is negative", function(){
        it("should return false", async function(){
            let response = await runner._askYesNo("question", "N");
            expect(response).to.equal(false);
        }) 
    })
})

describe ("clean", async function() {
    before(function () {
        fs.mkdirSync(options.i18n.dest);//TODO: move to options variable
    })

    context("Removing a file", function () {
        it("should remove the directory", async function () {
            //options.i18n.dest = dest;
            let res = await runner.clean(options);
            console.log(res);
            expect(res).to.eql([path.resolve(options.i18n.dest)]);
        });
    })

    
    context("invalid directory name", function () {
        modifiedOptions.i18n.dest = "thisdoesntexist";
        it("should return an empty array", async function () {
            let res = await runner.clean(modifiedOptions);
            expect(res).to.eql([]);
        });
    })

    
    after(function () {
        fs.removeSync(options.i18n.dest, {recursive: true})//TODO: move to options variable
    })
    
})

describe("build", function() {
    before(function () {


        let html = `
        <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="refresh" content="0;URL='/subfolder/'" /> 
                </head>
                <body>
                    <header>
                        <div class="container">
                            <h1 class="company-name"><a href="/"><img src="/images/logo.svg" alt="Urban" width="150"></a></h1>
                            <nav>
                                <a class="nav-toggle" id="open-nav" href="#">&#9776;</a>
                                <ul>
                                    <li><a href="/portfolio/" class="" >Portfolio</a></li>
                                    <li><a href="/blog/" class="" >Blog</a></li>
                                    <li><a href="/about/" class="" >About</a></li>
                                    <li><a href="/contact/" class="" >Contact</a></li>
                                </ul>
                            </nav>=
                        </div>
                    </header>
                    <section class="hero diagonal">
                        <div class="container">
                            <h2 data-i18n="homepage-title" data-i18n-attrs="descript" descript="random description to be translated" class="editable">We build nice websites</h2>
                            <p data-i18n="homepage-company-description" class="subtext editable">This is the <strong>Urban</strong> template from <a href="https://cloudcannon.com/">CloudCannon</a>. Urban is a strong foundation for the web presence of your agency.</p>
                            <p><a data-i18n="contact-us" class="button alt" href="/contact/">Contact Us</a></p>
                        </div>
                    </section>
                    <script>
                        document.getElementById("open-nav").onclick = function () {
                            document.body.classList.toggle("nav-open");
                            return false;
                        };
                    </script>
                </body>
            </html>
            `;
        let html2 = `
        <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                    <header>
                        <div class="container">
                            <h1 class="company-name"><a href="/"><img src="/images/logo.svg" alt="Urban" width="150"></a></h1>
                            <nav>
                                <a class="nav-toggle" id="open-nav" href="#">&#9776;</a>
                                <ul>
                                    <li><a href="/portfolio/" class="" >Portfolio</a></li>
                                    <li><a href="/blog/" class="" >Blog</a></li>
                                    <li><a href="/about/" class="" >About</a></li>
                                    <li><a href="/contact/" class="" >Contact</a></li>
                                </ul>
                            </nav>=
                        </div>
                    </header>
                    <section class="diagonal patterned">
                        <div class="container halves">
                            <div>
                                <h3 data-i18n="some-of-our-work" data-i18n-attrs="alt" class="editable">Some of our work</h3>
                                <p data-i18n="portfolio-description" class="editable">We take pride in our previous work and our happy customers. We cater to any sector to boost business and increase exposure.</p>
                                <p data-i18n="view-portfolio" class="editable"><a href="/portfolio/">View Full Portfolio &rarr;</a></p>
                                <p data-i18n class="editable"><a href="/portfolio/">Missing key?</a></p>
                            </div>
                            <div>
                                <ul class="image-grid">
                                        <li><a href="/clients/cause/"><img src="/images/clients/cause.jpg"></a></li>
                                        <li><a href="/clients/edition/"><img src="/images/clients/edition.png"></a></li>
                                        <li><a href="/clients/frisco/"><img src="/images/clients/frisco.jpg"></a></li>
                                        <li><a href="/clients/hydra/"><img src="/images/clients/hydra.png"></a></li>
                                </ul>
                            </div>
                        </div>
                    </section>
                    <script>
                        document.getElementById("open-nav").onclick = function () {
                            document.body.classList.toggle("nav-open");
                            return false;
                        };
                    </script>
                </body>
            </html>
            `;
            
        let preLocalized = `
        <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                    <header>
                        <div class="container">
                            <h1 class="company-name"><a href="/"><img src="/images/logo.svg" alt="Urban" width="150"></a></h1>
                            <nav>
                                <a class="nav-toggle" id="open-nav" href="#">&#9776;</a>
                                <ul>
                                    <li><a href="/pt-PT/portfolio/" class="" >Clientes</a></li>
                                    <li><a href="/pt-BR/blog/" class="" >Blog</a></li>
                                    <li><a href="/about/" class="" >Sobre Nos</a></li>
                                    <li><a href="/contact/" class="" >Contatos</a></li>
                                </ul>
                            </nav>=
                        </div>
                    </header>
                    <section class="hero diagonal">
                        <div class="container">
                            <h2 class="editable">We build nice websites</h2>
                            <p class="subtext editable">This is the <strong>Urban</strong> template from <a href="https://cloudcannon.com/">CloudCannon</a>. Urban is a strong foundation for the web presence of your agency.</p>
                            <p><a class="button alt" href="/contact/">Contact Us</a></p>
                        </div>
                    </section>
                    <script>
                        document.getElementById("open-nav").onclick = function () {
                            document.body.classList.toggle("nav-open");
                            return false;
                        };
                    </script>
                </body>
            </html>
            `;


        //Creat Source Files
        fs.mkdirSync(options.i18n.source);
        fs.mkdirSync(options.i18n.source+"/assets");
        fs.mkdirSync(options.i18n.source+"/css");
        fs.mkdirSync(options.i18n.source+"/html");
        fs.mkdirSync(options.i18n.source+"/pt-BR/");
        fs.writeFileSync(options.i18n.source+"/image.jpg", "image");
        fs.writeFileSync(options.i18n.source+"/assets/image2.jpg", "image");
        fs.writeFileSync(options.i18n.source+"/style.css", "css");
        fs.writeFileSync(options.i18n.source+"/css/style2.css", "css");
        fs.writeFileSync(options.i18n.source+"/index.html", html);
        fs.writeFileSync(options.i18n.source+"/html/index2.html", html2);
        fs.writeFileSync(options.i18n.source+"/pt-BR/preLocalized.html", preLocalized);

        //Create Locales
        fs.mkdirSync(options.i18n.generated_locale_dest);
        fs.mkdirSync(options.i18n.locale_source);
        localeBR = {
            "homepage-title": "Criamos websites para você",
            "homepage-title.descript": "Descrição aleatória a ser traduzida",
            "contact-us": "Entre em contato",
            "some-of-our-work": "Um pouco do nosso trabalho"
        };
        localePT = {
            "homepage-title": "POISH, Criamos websites para você"
        };
        localeFR = {
            "homepage-title": {
                original: "We build nice website",
                value: "Nous construisons de beaux sites Web"
            },
            "homepage-title.descript": {
                original: "random description to be translated",
                value: "Nous construisons de beaux sites Web"
            },
            "contact-us": {
                original: "Contact Us",
                value: "Nous contacter"
            }

        };
        fs.writeJsonSync(options.i18n.locale_source+"/pt-BR.json",localeBR);
        fs.writeJsonSync(options.i18n.locale_source+"/pt-PT.json",localePT);
        fs.writeJsonSync(options.i18n.locale_source+"/fr.json",localeFR);
        fs.writeFileSync(options.i18n.locale_source+"/es.json","Wrong JSON");
        fs.writeFileSync(options.i18n.locale_source+"/invalid.INVALID","Wrong JSON");

        process.env.GOOGLE_APPLICATION_CREDENTIALS = '/credentials.json'

        localeJA = {
            "bottom-title": "翻訳されるランダムな説明"
        };
        fs.writeJsonSync(options.i18n.locale_source+"/ja.json",localeJA);
        fs.writeJsonSync(options.i18n.locale_source+"/ja-jp.json",localeJA);
        
        //fs.mkdirSync(path.join(options.i18n.locale_source, "../wrapped"));
        //fs.writeJsonSync(path.join(options.i18n.locale_source, "../wrapped")+"/ja.json",localeJA);


    })

    context ("building with valid configs", function(){
        it("should return 0", async function(){

            chai.spy.on(wordwrap, 'callClientApi', function(requestBody){
                console.log("Spy on analyzeSyntax");
                return new Promise(resolve => {
                    /* Returns JSON data of annotations retrieved from the given text. */                   
                    resolve([{
                        sentences: [{}],
                        tokens: [{
                                text: {
                                    content: '翻訳',
                                    beginOffset: 0
                                },
                                partOfSpeech: {
                                    tag: 'NOUN',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'FORM_UNKNOWN',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'VOICE_UNKNOWN'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 5,
                                    label: 'RCMOD'
                                },
                                lemma: '翻訳'
                            },
                            {
                                text: {
                                    content: 'さ',
                                    beginOffset: 2
                                },
                                partOfSpeech: {
                                    tag: 'VERB',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'IRREALIS',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'VOICE_UNKNOWN'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 0,
                                    label: 'MWV'
                                },
                                lemma: 'さ'
                            },
                            {
                                text: {
                                    content: 'れる',
                                    beginOffset: 3
                                },
                                partOfSpeech: {
                                    tag: 'VERB',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'ADNOMIAL',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'PASSIVE'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 0,
                                    label: 'AUXPASS'
                                },
                                lemma: 'れる'
                            },
                            {
                                text: {
                                    content: 'ランダム',
                                    beginOffset: 5
                                },
                                partOfSpeech: {
                                    tag: 'ADJ',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'FORM_UNKNOWN',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'VOICE_UNKNOWN'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 5,
                                    label: 'AMOD'
                                },
                                lemma: 'ランダム'
                            },
                            {
                                text: {
                                    content: 'な',
                                    beginOffset: 9
                                },
                                partOfSpeech: {
                                    tag: 'VERB',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'ADNOMIAL',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'VOICE_UNKNOWN'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 3,
                                    label: 'AUX'
                                },
                                lemma: 'だ'
                            },
                            {
                                text: {
                                    content: '説明',
                                    beginOffset: 10
                                },
                                partOfSpeech: {
                                    tag: 'NOUN',
                                    aspect: 'ASPECT_UNKNOWN',
                                    case: 'CASE_UNKNOWN',
                                    form: 'FORM_UNKNOWN',
                                    gender: 'GENDER_UNKNOWN',
                                    mood: 'MOOD_UNKNOWN',
                                    number: 'NUMBER_UNKNOWN',
                                    person: 'PERSON_UNKNOWN',
                                    proper: 'NOT_PROPER',
                                    reciprocity: 'RECIPROCITY_UNKNOWN',
                                    tense: 'TENSE_UNKNOWN',
                                    voice: 'VOICE_UNKNOWN'
                                },
                                dependencyEdge: {
                                    headTokenIndex: 5,
                                    label: 'ROOT'
                                },
                                lemma: '説明'
                            }
                        ],
                        language: 'ja'
                    }]);
                });
            })
            
            let res = await runner.build( options );
            
            expect(res).to.equal(0);
            
        })

        
        it("should have the assets copied to dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/assets/image2.jpg")).to.equal(true);
        })

        it("should have a pt-BR folder on the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/pt-BR/")).to.equal(true);
        })
        it("should have a pt-PT folder on the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/pt-PT/")).to.equal(true);
        })
        it("should have a fr folder on the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/fr/")).to.equal(true);
        })
        
        it("should have an en folder on the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/en/")).to.equal(true);
        })
        
        it("should NOT have an es folder on the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/es/")).to.equal(false);
        })

        it("should have the pre localized files copied to dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/pt-BR/preLocalized.html")).to.equal(true);
        })

        it("should have a redirect index.html file on the root of the dest", async function(){
            expect(fs.existsSync(options.i18n.full_dest+"/index.html")).to.equal(true);
        })

        

    })

    after(function () {
        
        fs.removeSync(options.i18n.dest);

        fs.removeSync(options.i18n.source);
        fs.removeSync(options.i18n.source+"/assets");
        fs.removeSync(options.i18n.source+"/css");
        fs.removeSync(options.i18n.source+"/html");

        fs.removeSync(options.i18n.generated_locale_dest);
        fs.removeSync(options.i18n.locale_source);
    })
 
})
