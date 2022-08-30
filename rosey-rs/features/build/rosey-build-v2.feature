Feature: Rosey Build V2
	Scenario: Rosey builds from  V2 locales
		Given I have a "dist/site/index.html" file with the content:
			"""
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"seal": {
					"value": "👄🌹"
				}
			}
			"""
		When I run Rosey build
		Then I should see a selector 'title' in "dist/translated_site/index.html" with the attributes:
			| innerText | Redirecting... |
		And I should see a selector 'a' in "dist/translated_site/index.html" with the attributes:
			| href      | /en/                                  |
			| innerText | Click here if you are not redirected. |
		And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
			| data-rosey | seal             |
			| innerText  | Kiss From A Rose |
		And I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
			| data-rosey | seal |
			| innerText  | 👄🌹 |