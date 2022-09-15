Feature: Rosey Base
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey build is working
    Given I have a "rosey/locales/stub" file
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p>Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | build |
    Then I should see the file "dist/translated_site/index.html"
    Then I should see the file "dist/translated_site/en/index.html"

  Scenario: Rosey generate is working
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see the file "rosey/source.json"
