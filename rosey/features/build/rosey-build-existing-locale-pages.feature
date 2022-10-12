Feature: Rosey Build Existing Locale Pages
  If I want a different page for one specific language,
  I can create that file in my source.
  Rosey will translate that file into its language,
  but won't translate it into any others.

  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey uses existing locale pages if they exist
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-page-type="Standard Homepage" data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "dist/site/em/index.html" file with the content:
      """
      <html>
      <body>
      <p data-page-type="Emoji Homepage" data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    And I have a "rosey/locales/blocks.json" file with the content:
      """
      {
        "seal": "🅺🅸🆂🆂 🅵🆁🅾🅼 🅰 🆁🅾🆂🅴"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey     | seal              |
      | data-page-type | Standard Homepage |
      | innerText      | Kiss From A Rose  |
    And I should see a selector 'p' in "dist/translated_site/blocks/index.html" with the attributes:
      | data-rosey     | seal                          |
      | data-page-type | Standard Homepage             |
      | innerText      | 🅺🅸🆂🆂 🅵🆁🅾🅼 🅰 🆁🅾🆂🅴 |
    And I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey     | seal           |
      | data-page-type | Emoji Homepage |
      | innerText      | 👄🌹           |
    But I should not see the file "dist/translated_site/blocks/em/index.html"
    And I should not see the file "dist/translated_site/em/blocks/index.html"


  Scenario: Rosey uses nested existing locale pages if they exist
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-page-type="Standard Homepage" data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "dist/site/em/nested/index.html" file with the content:
      """
      <html>
      <body>
      <p data-page-type="Emoji Homepage" data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    And I have a "rosey/locales/blocks.json" file with the content:
      """
      {
        "seal": "🅺🅸🆂🆂 🅵🆁🅾🅼 🅰 🆁🅾🆂🅴"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey     | seal              |
      | data-page-type | Standard Homepage |
      | innerText      | Kiss From A Rose  |
    And I should see a selector 'p' in "dist/translated_site/blocks/index.html" with the attributes:
      | data-rosey     | seal                          |
      | data-page-type | Standard Homepage             |
      | innerText      | 🅺🅸🆂🆂 🅵🆁🅾🅼 🅰 🆁🅾🆂🅴 |
    And I should see a selector 'p' in "dist/translated_site/em/nested/index.html" with the attributes:
      | data-rosey     | seal           |
      | data-page-type | Emoji Homepage |
      | innerText      | 👄🌹           |
    And I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey     | seal              |
      | data-page-type | Standard Homepage |
      | innerText      | 👄🌹              |
    But I should not see the file "dist/translated_site/blocks/em/nested/index.html"
    And I should not see the file "dist/translated_site/em/blocks/index.html"
