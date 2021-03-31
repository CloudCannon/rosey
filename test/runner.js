/* eslint-disable quote-props */
const chai = require('chai');
const cheerio = require('cheerio');
const defaults = require('defaults');
const jsonPointer = require('json-pointer');
const fs = require('fs-extra');
const log = require('fancy-log');
const path = require('path');
const spies = require('chai-spies');

const wordwrap = require('../lib/plugins/wordwrap-json');
const runner = require('../lib/runner.js');
const cli = require('../cli.js');

chai.use(spies);

const { expect } = chai;
// const readFile = promisify(fs.readFile);

// Load default settings
const flags = { yes: true, verbose: true };
const options = cli.setOptions({ flags: flags });

// Modify paths for test purpose

const cwd = process.cwd();
const dest = 'test/dest';
const source = 'test/source';
const localeSource = 'test/rosey/locale';
const generatedLocaleDest = 'test/rosey/source.json';

options.rosey.dest = dest;
options.rosey.source = source;
options.rosey.locale_source = localeSource;
options.rosey.generated_locale_dest = generatedLocaleDest;
options.rosey.generated_locale_dest_path = path.dirname(generatedLocaleDest);
options.rosey.generated_locale_dest_file = path.basename(generatedLocaleDest);

options.rosey.full_dest = path.resolve(cwd, dest);
options.rosey.full_source = path.resolve(cwd, source);
options.rosey.full_locale_source = path.resolve(cwd, localeSource);
options.rosey.full_generated_locale_dest = path.resolve(cwd, generatedLocaleDest);
// eslint-disable-next-line max-len
options.rosey.full_generated_locale_dest_path = path.resolve(cwd, options.rosey.generated_locale_dest_path);

options.rosey.credentials = '/credentials.json';

let modifiedOptions = {};
modifiedOptions = defaults(modifiedOptions, options);

const localeBR = {
	'homepage-title': 'Criamos websites para você',
	'homepage-title.descript': 'Descrição aleatória a ser traduzida',
	'contact-us': 'Entre em contato',
	'some-of-our-work': 'Um pouco do nosso trabalho'
};
const localePT = {
	'homepage-title': 'POISH, Criamos websites para você'
};
const localeFR = {
	'homepage-title': {
		original: 'We build nice website',
		value: 'Nous construisons de beaux sites Web'
	},
	'homepage-title.descript': {
		original: 'random description to be translated',
		value: 'Nous construisons de beaux sites Web'
	},
	'contact-us': {
		original: 'Contact Us',
		value: 'Nous contacter'
	}

};
const localeRS = {
	'0Pm75CuMAuL17aHK7NygQ+K+2RcLVXa+uX7LdnO2TkQ': {
		original: '\n                            <a href="cloudcannon:collections/_data/footer.yml" class="btn">\n                                <strong>&#9998;</strong> Update Footer Sections</a>\n                        ',
		value: ''
	},
	'KON8fKUYnhjh549v0V7gTOiufsF1eYznwJNJbWG2rgY': {
		original: 'Home',
		value: ''
	},
	'LZWt/W8QjSfGY8qG29ixQyxwihJBCmn6Apz8h68EVwg': {
		original: '<a href="/portfolio/">Missing key?</a>',
		value: ''
	},
	'about:meta:title': {
		original: 'About Page',
		value: 'New About Page Title'
	},
	'contact-us': {
		original: 'Contact Us',
		value: ''
	},
	'home:meta:title': {
		original: 'Home Page',
		value: 'New Home Page Title'
	},
	'homepage-company-description': {
		original: 'This is the <strong>Urban</strong> template from <a href="https://cloudcannon.com/">CloudCannon</a>. Urban is a strong foundation for the web presence of your agency.',
		value: ''
	},
	'homepage-title': {
		original: 'We build nice websites',
		value: ''
	},
	'homepage-title.descript': {
		original: 'random description to be translated',
		value: 'DescriptionValueToBeCheckedOnTheTranslatedWebsite'
	},
	'menu-portfolio': {
		original: 'Portfolio',
		value: ''
	},
	'meta-title': {
		original: 'HTML TITLE',
		value: 'NewTitleToCheckOnExplicitAtribute'
	},
	'meta-descript': {
		original: 'HTML DESC',
		value: 'New Description to Check on ATTR tag'
	},
	'notNested:branding': {
		original: 'Branding title',
		value: 'New translated title for the branding element'
	},
	'portfolio-description': {
		original: 'We take pride in our previous work and our happy customers. We cater to any sector to boost business and increase exposure.',
		value: ''
	},
	'qt8GcQ6z7SHjYxmdhirp4cddL+YA/hx6Oyfa3x4CH9Y': {
		original: 'Blog',
		value: ''
	},
	'rU81YcMaFGiZdU/ld17APEHxfVesQJ+cqofF5H2fGLQ': {
		original: 'About',
		value: ''
	},
	'some-of-our-work': {
		original: 'Some of our work',
		value: 'Value to be checked for the whole element'
	},
	'some-of-our-work.alt': {
		original: '',
		value: 'Value To Be Checked On The Translated Website'
	},
	'view-portfolio': {
		original: '<a href="/portfolio/">View Full Portfolio &rarr;</a>',
		value: ''
	},
	'john.details.description': {
		original: 'Ambassador description',
		value: 'Translated text for description'
	}
};
const localeGA = {
	'0Pm75CuMAuL17aHK7NygQ+K+2RcLVXa+uX7LdnO2TkQ': {
		original: '\n                            <a href="cloudcannon:collections/_data/footer.yml" class="btn">\n                                <strong>&#9998;</strong> Update Footer Sections</a>\n                        ',
		value: ''
	},
	'KON8fKUYnhjh549v0V7gTOiufsF1eYznwJNJbWG2rgY': {
		original: 'Home',
		value: ''
	},
	'LZWt/W8QjSfGY8qG29ixQyxwihJBCmn6Apz8h68EVwg': {
		original: '<a href="/portfolio/">Missing key?</a>',
		value: ''
	},
	'contact-us': {
		original: 'Contact Us',
		value: ''
	},
	'homepage-company-description': {
		original: 'This is the <strong>Urban</strong> template from <a href="https://cloudcannon.com/">CloudCannon</a>. Urban is a strong foundation for the web presence of your agency.',
		value: ''
	},
	'homepage-title': {
		original: 'outdated',
		value: ''
	},
	'homepage-title.descript': {
		original: 'outdated',
		value: ''
	},
	'unused': {
		original: 'Portfolio',
		value: ''
	},
	'qt8GcQ6z7SHjYxmdhirp4cddL+YA/hx6Oyfa3x4CH9Y': {
		original: 'Blog',
		value: ''
	},
	'rU81YcMaFGiZdU/ld17APEHxfVesQJ+cqofF5H2fGLQ': {
		original: 'About',
		value: ''
	},
	'some-of-our-work': {
		original: 'Some of our work',
		value: ''
	},
	'some-of-our-work.alt': {
		original: '',
		value: ''
	},
	'view-portfolio': {
		original: '<a href="/portfolio/">View Full Portfolio &rarr;</a>',
		value: ''
	}
};
const localeJA = {
	'bottom-title': '翻訳されるランダムな説明',
	'about:meta:title': 'ページについて'
};

const preLocalizedMarker = '<title>I AM PRELOCALISED</title>';

function createTestingStructure() {
	const html = `
    <!doctype html>
        <html lang="en">
            <head data-rosey-ns="home:meta">
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="refresh" content="0;URL='/subfolder/'" /> 
                <title data-rosey="title">Home Page</title>
            </head>
            <body>
                <header>
                    <div class="container">
                        <h1 class="company-name"><a href="/"><img src="/images/logo.svg" alt="Urban" width="150"></a></h1>
                        <nav>
                            <a class="nav-toggle" id="open-nav" href="#">&#9776;</a>
                            <ul>
                                <li><a data-rosey="menu-portfolio" href="/portfolio/" class="" >Portfolio</a></li>
                                <li><a href="/blog/" class="" >Blog</a></li>
                                <li><a href="/about/" class="" >About</a></li>
                                <li><a href="/contact/" class="" >Contact</a></li>
                            </ul>
                        </nav>=
                    </div>
                </header>
                <section class="hero diagonal">
                    <div class="container">
                        <h2 data-rosey="homepage-title" class="editable">We build nice websites</h2>
                        <p data-rosey="homepage-company-description" class="subtext editable">This is the <strong>Urban</strong> template from <a href="https://cloudcannon.com/">CloudCannon</a>. Urban is a strong foundation for the web presence of your agency.</p>
                        <p><a data-rosey="contact-us" class="button alt" href="/contact/">Contact Us</a></p>
                    </div>
                </section>
                <footer class="diagonal">
                    <div class="container">
                        <p data-rosey  class="editor-link">
                            <a href="cloudcannon:collections/_data/footer.yml" class="btn">
                                <strong>&#9998;</strong> Update Footer Sections</a>
                        </p>
                        <div class="footer-columns">
                            <ul class="footer-links">
                                <li>
                                    <h2>Pages</h2>
                                </li>
                                <li>
                                    <a data-rosey   href="/" >Home</a>
                                </li>
                                <li>
                                    <a data-rosey="menu-portfolio"  href="/portfolio/" >Portfolio</a>
                                </li>
                                <li>
                                    <a data-rosey   href="/blog/" >Blog</a>
                                </li>
                                <li>
                                    <a data-rosey   href="/about/" >About</a>
                                </li>
                                <li>
                                    <a  href="/contact/" >Contact</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="legal-line">
                        <p class="container">&copy; 2020 Urban Ltd &bull; Template by <a href="https://cloudcannon.com/">CloudCannon</a>
                        </p>
                    </div>
                </footer>                
                <script>
                    document.getElementById("open-nav").onclick = function () {
                        document.body.classList.toggle("nav-open");
                        return false;
                    };
                </script>
            </body>
        </html>
        `;
	const html2 = `
    <!doctype html>
        <html lang="en">
            <head data-rosey-ns="about:meta">
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title data-rosey="title">About Page</title>
            </head>
            <body>
                <header>
                    <div class="container">
                        <h1 class="company-name"><a href="/"><img src="/images/logo.svg" alt="Urban" width="150"></a></h1>
                        <nav>
                            <a class="nav-toggle" id="open-nav" href="#">&#9776;</a>
                            <ul>
                                <li><a data-rosey="menu-portfolio" href="/portfolio/" class="" >Portfolio</a></li>
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
                            <h3 data-rosey="some-of-our-work" class="editable">Some of our work</h3>
                            <p data-rosey="portfolio-description" class="editable">We take pride in our previous work and our happy customers. We cater to any sector to boost business and increase exposure.</p>
                            <p data-rosey="view-portfolio" class="editable"><a href="/portfolio/">View Full Portfolio &rarr;</a></p>
                            <p data-rosey class="editable"><a href="/portfolio/">Missing key?</a></p>
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
                <footer class="diagonal">
                    <div class="container">
                        <p data-rosey  class="editor-link">
                            <a href="cloudcannon:collections/_data/footer.yml" class="btn">
                                <strong>&#9998;</strong> Update Footer Sections</a>
                        </p>
                        <div class="footer-columns">
                            <ul class="footer-links">
                                <li>
                                    <h2>Pages</h2>
                                </li>
                                <li>
                                    <a data-rosey   href="/" >Home</a>
                                </li>
                                <li>
                                    <a data-rosey="menu-portfolio"  href="/portfolio/" >Portfolio</a>
                                </li>
                                <li>
                                    <a data-rosey   href="/blog/" >Blog</a>
                                </li>
                                <li>
                                    <a data-rosey   href="/about/" >About</a>
                                </li>
                                <li>
                                    <a  href="/contact/" >Contact</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="legal-line">
                        <p class="container">&copy; 2020 Urban Ltd &bull; Template by <a href="https://cloudcannon.com/">CloudCannon</a>
                        </p>
                    </div>
                </footer>                
                <script>
                    document.getElementById("open-nav").onclick = function () {
                        document.body.classList.toggle("nav-open");
                        return false;
                    };
                </script>
            </body>
        </html>
        `;
	const htmlAttrs = `
          <!doctype html>
          <html lang="en">
            <head>
              <title data-rosey="meta-title">HTML TITLE</title>
              <title data-rosey="meta-descript">HTML DESC</title>
              <meta name="twitter:title" data-rosey-attrs-explicit='{"content":"meta-title"}' content="HTML TITLE">
              <meta name="twitter:descript" data-rosey-attrs-explicit='{"description":"meta-descript"}' description="DESC">
              <meta name="other:tag" data-rosey-attrs-explicit='{"content":"meta-title","description":"meta-descript"}' content="HTML TITLE" description="HTML DESC Different Content">
            </head>
            <body>
              <div data-rosey-ns="home:meta">
                <h1 name="HomePageH1" data-rosey-attrs-explicit='{"alt":"title"}' alt="Home Page">Home Page</h1>
                <h2 data-rosey="title">Home Page</h2>
              </div>
              <h2 data-rosey="homepage-title" data-rosey-attrs="descript" descript="random description to be translated" class="editable">We build nice websites</h2>            
              <h3 data-rosey="some-of-our-work" data-rosey-attrs="alt" class="editable">Some of our work</h3>

              <div data-rosey-root="notNested">
                <div data-rosey-ns="nested">
                  <h4 data-rosey="branding">Branding title</h2>
                </div>
              </div>
            </body>
          </html>
      `;
	const preLocalized = `
    <!doctype html>
        <html lang="en">
			<head>
				${preLocalizedMarker}
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
                                <li><a href="/pt-BR/portfolio/" class="" >Clientes</a></li>
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

	const ambassadors = `
		{
			"ambassadors": [
				{
					"name": "John",
					"details": {
						"description": "Ambassador description",
						"info_markdown": "#Some markdown"
					},
					"tags": [
						"cool",
						"blue",
						"round"
					],
					"surname":"Mark",
					"likes": "rum and coca-cola"
				},
				{
					"name": "Samson",
					"details": {
						"description": "Big boi",
						"info_markdown": "- one- two"
					},
					"tags": [
						"green",
						"yellow",
						"red"
					]
				},
				{
					"name": "Samson",
					"details": {
						"description": "Big boi Duplicated",
						"info_markdown": "- one- two"
					},
					"tags": [
						"green",
						"yellow",
						"red"
					]
				}
			]
		}`;

	const schema = `
		{
			"ambassadors": [
				{
					"name": "rosey-ns|rosey:name",
					"details": {
						"description": "rosey:details.description",
						"info_markdown": "rosey:details.info_markdown"
					},
					"tags": [ "rosey-array-ns|rosey:value" ],
		
					"surname":"rosey:surname",
					"likes": "rosey|:likes"
				}
			]
		}`;

	// Creat Source Files
	fs.mkdirSync(options.rosey.source);
	fs.mkdirSync(`${options.rosey.source}/assets`);
	fs.mkdirSync(`${options.rosey.source}/css`);
	fs.mkdirSync(`${options.rosey.source}/html`);
	fs.mkdirSync(`${options.rosey.source}/pt-BR/`);
	fs.writeFileSync(`${options.rosey.source}/image.jpg`, 'image');
	fs.writeFileSync(`${options.rosey.source}/assets/image2.jpg`, 'image');
	fs.writeFileSync(`${options.rosey.source}/style.css`, 'css');
	fs.writeFileSync(`${options.rosey.source}/css/style2.css`, 'css');
	fs.writeFileSync(`${options.rosey.source}/index.html`, html);
	fs.writeFileSync(`${options.rosey.source}/htmlAttrs.html`, htmlAttrs);
	fs.writeFileSync(`${options.rosey.source}/html/index2.html`, html2);
	fs.writeFileSync(`${options.rosey.source}/pt-BR/preLocalized.html`, preLocalized);

	// Creat Source Files
	fs.writeFileSync(`${options.rosey.source}/ambassadors.json`, ambassadors);
	fs.writeFileSync(`${options.rosey.source}/ambassadors.rosey.json`, schema);
	fs.writeFileSync(`${options.rosey.source}/ambassadorsSchemaLess.json`, ambassadors);
}

function createLocales() {
	// Create Locales
	fs.mkdirSync(options.rosey.generated_locale_dest_path);
	fs.mkdirSync(options.rosey.locale_source);

	fs.writeJsonSync(`${options.rosey.locale_source}/pt-BR.json`, localeBR);
	fs.writeJsonSync(`${options.rosey.locale_source}/pt-PT.json`, localePT);
	fs.writeJsonSync(`${options.rosey.locale_source}/fr.json`, localeFR);
	fs.writeJsonSync(`${options.rosey.locale_source}/rs.json`, localeRS);
	fs.writeJsonSync(`${options.rosey.locale_source}/ga.json`, localeGA);
	fs.writeFileSync(`${options.rosey.locale_source}/es.json`, 'Wrong JSON');
	fs.writeFileSync(`${options.rosey.locale_source}/invalid.INVALID`, 'Wrong JSON');

	// process.env.GOOGLE_APPLICATION_CREDENTIALS = '/credentials.json';

	fs.writeJsonSync(`${options.rosey.locale_source}/ja.json`, localeJA);
	fs.writeJsonSync(`${options.rosey.locale_source}/ja-jp.json`, localeJA);

	// fs.mkdirSync(path.join(options.rosey.locale_source, "../wrapped"));
	// fs.writeJsonSync(path.join(options.rosey.locale_source, "../wrapped")+"/ja.json",localeJA);
}

async function cleanUpFilesAfterTest() {
	await fs.remove(options.rosey.generated_locale_dest_path);
	await fs.remove(options.rosey.locale_source);
	// await fs.remove(path.join(options.rosey.generated_locale_dest, '../wrapped'));
	await fs.remove(options.rosey.source);
	await fs.remove(options.rosey.dest);
}

async function checkAttribute(file, selector, attribute, expectedValue) {
	const html = await fs.readFile(file, 'utf-8');
	const $ = cheerio.load(html,
		{
			_useHtmlParser2: true,
			lowerCaseAttributeNames: false,
			decodeEntities: false
		});

	const $el = $(selector);
	// log($el.attr(attribute));
	// log(expectedValue);
	return expect($el.attr(attribute)).to.equal(expectedValue);
}

async function checkElement(file, selector, expectedValue) {
	const html = await fs.readFile(file, 'utf-8');
	// log(html);
	const $ = cheerio.load(html,
		{
			_useHtmlParser2: true,
			lowerCaseAttributeNames: false,
			decodeEntities: false
		});
	const $el = $(selector);
	// log('found:', $el.html());
	// log('expected:', expectedValue);
	return expect($el.html()).to.equal(expectedValue);
}

async function checkJsonElement(file, selector, expectedValue) {
	const fileContent = await fs.readFile(file, 'utf-8');

	const jsonContent = JSON.parse(fileContent);

	const elementContent = jsonPointer.get(jsonContent, selector);

	return expect(elementContent).to.equal(expectedValue);
}

describe('askYesNo', () => {
	context('Response is affirmative', () => {
		it('should return true', async () => {
			const response = await runner.askYesNo('question', 'Y');
			expect(response).to.equal(true);
		});
	});

	context('Response is negative', () => {
		it('should return false', async () => {
			const response = await runner.askYesNo('question', 'N');
			expect(response).to.equal(false);
		});
	});
});

describe('clean', () => {
	before(async () => {
		fs.mkdirSync(options.rosey.dest);
	});

	context('Removing a file', () => {
		it('should remove the directory', async () => {
			// options.rosey.dest = dest;
			const res = await runner.clean(options);
			log(res);
			expect(res).to.eql([path.resolve(options.rosey.dest)]);
		});
	});

	context('invalid directory name', () => {
		it('should return an empty array', async () => {
			modifiedOptions.rosey.dest = 'thisdoesntexist';
			const res = await runner.clean(modifiedOptions);
			modifiedOptions.rosey.dest = options.rosey.dest;
			expect(res).to.eql([]);
		});
	});

	after(async () => {
		fs.removeSync(options.rosey.dest, { recursive: true });// TODO: move to options variable
	});
});

describe('generateFromHTML', () => {
	before(async () => {
		createTestingStructure();
	});

	context('Generate version 2 document', () => {
		it('rosey generated locale path file should not exist', async () => {
			expect(fs.existsSync(options.rosey.full_generated_locale_dest)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			const res = runner.generate(options);
			await res;
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});
	});

	context('Generate version 1 document', () => {
		it('rosey generated locale path file should not exist', async () => {
			expect(fs.existsSync(options.rosey.full_generated_locale_dest)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			modifiedOptions.rosey.source_version = 1;

			const res = runner.generate(modifiedOptions);
			await res;
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});
	});

	afterEach(async () => {
		fs.removeSync(options.rosey.full_generated_locale_dest);
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});

describe('generateFromJSON', () => {
	before(async () => {
		createTestingStructure();
	});

	context('Generate version 2 document', () => {
		it('rosey generated locale path file should not exist', async () => {
			expect(fs.existsSync(options.rosey.full_generated_locale_dest)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			const res = runner.generate(options);
			await res;
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});
	});
	afterEach(async () => {
		fs.removeSync(options.rosey.full_generated_locale_dest);
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});

describe('check', () => {
	before(async () => {
		createTestingStructure();
		createLocales();
	});

	context('Check on wrong locales folder', () => {
		it('should reject the promise ', async () => {
			modifiedOptions.rosey.locale_source = '/WrongFolderPath/';

			let isResolved = null;
			const expectedResult = false;

			await runner.check(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			// Revert modified settings
			modifiedOptions.rosey.locale_source = options.rosey.locale_source;
		});
	});

	context('Check on missing source.json file', () => {
		it('should reject the promise ', async () => {
			let isResolved = null;
			const expectedResult = false;

			await runner.check(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);
		});
	});

	context('Check against version 2 document', () => {
		it('rosey generated locale path file should not exist', async () => {
			// Remove before starting
			fs.removeSync(`${options.rosey.full_generated_locale_dest}`);
			fs.removeSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			let isResolved = null;
			const expectedResult = true;

			await runner.generate(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});

		it('should create the checks.json file', async () => {
			let isResolved = null;
			const expectedResult = true;

			await runner.check(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(true);
		});

		it('should match the results on the checks.json file', async () => {
			const checks = await fs.readJson(path.join(options.rosey.full_generated_locale_dest_path, '/checks.json'));
			expect(checks.ga.states.missing).to.equal(21);
			expect(checks.ga.states.current).to.equal(10);
			expect(checks.ga.states.outdated).to.equal(2);
			expect(checks.ga.states.unused).to.equal(1);
		});
	});

	context('Check against version 1 document', () => {
		it('generated locale path file should not exist', async () => {
			// Remove before starting
			fs.removeSync(`${options.rosey.full_generated_locale_dest}`);
			fs.removeSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			modifiedOptions.rosey.source_version = 1;

			let isResolved = null;
			const expectedResult = true;
			await runner.generate(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);

			// revert the modified options
			modifiedOptions.rosey.source_version = options.rosey.source_version;
		});

		it('should create the checks.json file', async () => {
			modifiedOptions.rosey.source_version = 1;

			let isResolved = null;
			const expectedResult = true;

			await runner.check(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(true);

			// revert the modified options
			modifiedOptions.rosey.source_version = options.rosey.source_version;
		});

		it('should match the results on the checks.json file', async () => {
			const checks = await fs.readJson(path.join(options.rosey.full_generated_locale_dest_path, '/checks.json'));
			expect(checks.rs.states.missing).to.equal(13);
			expect(checks.rs.states.current).to.equal(20);
			expect(checks.rs.states.outdated).to.equal(0);
			expect(checks.rs.states.unused).to.equal(0);
		});
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});

describe('convert', () => {
	before(async () => {
		createTestingStructure();
		createLocales();
	});

	context('Convert with missing source.json file', () => {
		it('rosey generated locale path file should not exist', async () => {
			// Remove before starting
			fs.removeSync(`${options.rosey.full_generated_locale_dest}`);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(false);
		});

		it('should reject the promise ', async () => {
			let isResolved = null;
			const expectedResult = false;

			await runner.convert(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);
		});
	});

	context('Convert on wrong locales folder', () => {
		it('should create the source.json file', async () => {
			let isResolved = null;
			const expectedResult = true;

			await runner.generate(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});

		it('should reject the promise ', async () => {
			modifiedOptions.rosey.locale_source = '/WrongFolderPath/';

			let isResolved = null;
			const expectedResult = false;

			await runner.convert(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			// Revert modified settings
			modifiedOptions.rosey.locale_source = options.rosey.locale_source;
		});
	});

	context('Check against version 2 document', () => {
		it('rosey generated locale path file should not exist', async () => {
			// Remove before starting
			fs.removeSync(`${options.rosey.full_generated_locale_dest}`);
			fs.removeSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			let isResolved = null;
			const expectedResult = true;

			await runner.generate(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);
		});

		it('should create the converted.json files', async () => {
			let isResolved = null;
			const expectedResult = true;

			await runner.convert(options)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);
		});

		it('should have a pt-BR converted file', async () => {
			expect(fs.existsSync(`${options.rosey.full_locale_source}/v2/pt-BR.json`)).to.equal(true);
		});

		it('should have a pt-PT converted file', async () => {
			expect(fs.existsSync(`${options.rosey.full_locale_source}/v2/pt-PT.json`)).to.equal(true);
		});

		it('should have a ja converted file', async () => {
			expect(fs.existsSync(`${options.rosey.full_locale_source}/v2/ja.json`)).to.equal(true);
		});

		it('should NOT have a rs converted file', async () => {
			expect(fs.existsSync(`${options.rosey.full_locale_source}/v2/rs.json`)).to.equal(false);
		});
	});

	context('Check against version 1 document', () => {
		it('generated locale path file should not exist', async () => {
			// Remove before starting
			fs.removeSync(`${options.rosey.full_generated_locale_dest}`);
			fs.removeSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest_path}/checks.json`)).to.equal(false);
		});

		it('should create the source.json file', async () => {
			modifiedOptions.rosey.source_version = 1;

			let isResolved = null;
			const expectedResult = true;

			await runner.generate(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch(() => {
					log('promise is rejected');
					isResolved = false;
				});

			expect(isResolved).to.equal(expectedResult);

			expect(fs.existsSync(`${options.rosey.full_generated_locale_dest}`)).to.equal(true);

			// revert the modified options
			modifiedOptions.rosey.source_version = options.rosey.source_version;
		});

		it('should not be able to create, expecting different version of source.json file', async () => {
			modifiedOptions.rosey.source_version = 1;

			let isResolved = null;
			const expectedResult = false;

			await runner.convert(modifiedOptions)
				.then(() => {
					log('promise is resolved');
					isResolved = true;
				}).catch((errVersion) => {
					log('promise is rejected');
					isResolved = false;
					expect(errVersion.message).to.contain('Convert is only possible from a Version 2 source file.');
				});

			expect(isResolved).to.equal(expectedResult);

			// revert the modified options
			modifiedOptions.rosey.source_version = options.rosey.source_version;
		});
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});
describe('build', () => {
	before(async () => {
		createTestingStructure();
		createLocales();
	});

	context('build with missing locales folder', () => {
		it('should return 1', async () => {
			modifiedOptions.rosey.locale_source = 'wronginexistentpath';
			modifiedOptions.rosey.full_locale_source = 'wronginexistentpath';

			const res = await runner.build(modifiedOptions);

			expect(res).to.equal(1);
			modifiedOptions.rosey.locale_source = options.rosey.locale_source;
			modifiedOptions.rosey.full_locale_source = options.rosey.full_locale_source;
		});
	});

	context('building with valid configs', () => {
		it('should return 0', async () => {
			chai.spy.on(wordwrap, 'callClientApi', () => {
				log('Spy on analyzeSyntax');
				return new Promise((resolve) => {
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
			});

			chai.spy.on(runner, 'serve', () => { log('Ignoring serve on tests.'); });
			chai.spy.on(runner, 'watch', () => { log('Ignoring watch on tests.'); });

			const res = await runner.rosey(options);

			expect(res).to.equal(0);
		});

		it('should have the assets copied to dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/assets/image2.jpg`)).to.equal(true);
		});

		it('should have a pt-BR folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-BR/`)).to.equal(true);
		});
		it('should have a pt-PT folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-PT/`)).to.equal(true);
		});
		it('should have a fr folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/fr/`)).to.equal(true);
		});
		it('should have the correct translation for descript attribute', async () => {
			const selector = `[${options.rosey.data_tag}=homepage-title]`;
			const translation = localeRS['homepage-title.descript'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'descript', translation);
		});
		it('should have the correct translation for alt attribute', async () => {
			const selector = `[${options.rosey.data_tag}=some-of-our-work]`;
			const translation = localeRS['some-of-our-work.alt'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'alt', translation);
		});
		it('should have the correct translation for explicit defined attribute', async () => {
			const selector = '[name="twitter:title"]';
			const translation = localeRS['meta-title'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'content', translation);
		});
		it('should have the correct translation for explicit defined attribute with namespace', async () => {
			const selector = '[name="HomePageH1"]';
			const translation = localeRS['home:meta:title'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'alt', translation);
		});
		it('should have the correct translation for multiple explicit defined attribute', async () => {
			const selector = '[name="other:tag"]';
			let translation = localeRS['meta-title'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'content', translation);

			translation = localeRS['meta-descript'].value;
			await checkAttribute(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, 'description', translation);
		});

		it('should have the correct translation for the whole element', async () => {
			const selector = `[${options.rosey.data_tag}=some-of-our-work]`;
			const translation = localeRS['some-of-our-work'].value;

			await checkElement(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, translation);
		});
		it('should have the correct translation for a element using namespace', async () => {
			const selector = `[${options.rosey.data_tag}=title]`;
			const translation = localeRS['home:meta:title'].value;

			await checkElement(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, translation);
		});
		it('should have the correct translation for a element using root namespace', async () => {
			const selector = `[${options.rosey.data_tag}=branding]`;
			const translation = localeRS['notNested:branding'].value;

			await checkElement(path.join(options.rosey.dest, 'rs/htmlAttrs.html'), selector, translation);
		});

		it('should have the correct translation for a JSON translation', async () => {
			const selector = '/ambassadors/0/details/description';
			const translation = localeRS['john.details.description'].value;

			await checkJsonElement(path.join(options.rosey.dest, 'rs/ambassadors.json'), selector, translation);
		});

		it('should have an en folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/en/`)).to.equal(true);
		});

		it('should NOT have an es folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/es/`)).to.equal(false);
		});

		it('should have the pre localized files copied to dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-BR/preLocalized.html`)).to.equal(true);
		});

		it('should have a redirect index.html file on the root of the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/index.html`)).to.equal(true);
		});
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});

describe('base', () => {
	before(async () => {
		createTestingStructure();
		createLocales();
	});

	context('running the base command', () => {
		it('should return 0', async () => {
			const res = await runner.base(options);
			expect(res).to.equal(0);
		});

		it('should have the assets copied to dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/assets/image2.jpg`)).to.equal(true);
		});
		it('should have pt-BR folder on the dest due to the preLocalized files', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-BR/`)).to.equal(true);
		});

		it('should NOT have any language specific folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-PT/`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_dest}/fr/`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_dest}/en/`)).to.equal(false);
		});
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});

describe('translate', () => {
	before(async () => {
		modifiedOptions = options;
		createTestingStructure();
		createLocales();
	});

	context('running the translate command', () => {
		it('should return 0', async () => {
			modifiedOptions.flags.partialLanguages = ['PT-BR', 'FR'];
			modifiedOptions.rosey.credentials = undefined;

			const res = await runner.translate(modifiedOptions);
			expect(res).to.equal(0);
			modifiedOptions.rosey.credentials = '/credentials.json';
			modifiedOptions.flags.partialLanguages = null;
		});

		it('should NOT have the assets copied to dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/assets/image2.jpg`)).to.equal(false);
		});

		it('should have a pt-BR folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-BR/`)).to.equal(true);
		});
		it('should have a fr folder on the dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/fr/`)).to.equal(true);
		});
		it('should have the pre localized files copied to dest', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-BR/preLocalized.html`)).to.equal(true);

			const preLocalized = fs.readFileSync(`${options.rosey.full_dest}/pt-BR/preLocalized.html`).toString('utf-8');

			expect(preLocalized.indexOf(preLocalizedMarker)).to.be.greaterThan(0);
			// console.log(preLocalized);
		});

		it('should NOT have a the folders not part of the specified languages', async () => {
			expect(fs.existsSync(`${options.rosey.full_dest}/pt-PT/`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_dest}/en/`)).to.equal(false);
			expect(fs.existsSync(`${options.rosey.full_dest}/es/`)).to.equal(false);
		});
	});

	after(async () => {
		await cleanUpFilesAfterTest();
	});
});
