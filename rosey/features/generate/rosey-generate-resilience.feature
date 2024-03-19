Feature: Rosey Generate v2
	Background:
		Given I have the environment variables:
			| ROSEY_SOURCE | dist/site            |
			| ROSEY_DEST   | dist/translated_site |

	Scenario: Rosey generates base.json files with templates
		Given I have a "dist/site/index.html" file with the content:
			"""
      <html>
        <body data-rosey-ns='home'>
		  <template>
          <h1 data-rosey="title">Home page title</h1>
          <div data-rosey-root="contact">
            <p data-rosey="contact-us">Contact content</p>
            <div data-rosey-ns="inner">
              <p data-rosey="author">CloudCannon</p>
            </div>
          </div>
		  </template>
        </body>
      </html>
			"""
		When I run my program with the flags:
			| generate |
		Then I should see "rosey/base.json" containing the values:
			| version                            | int:2           |
			| keys.home:title.original           | Home page title |
			| keys.contact:contact-us.original   | Contact content |
			| keys.contact:inner:author.original | CloudCannon     |
