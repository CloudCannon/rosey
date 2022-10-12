Feature: Rosey Generate Metadata
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey includes translation counts
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      <p data-rosey="sting">Desert Rose</p>
      </body>
      </html>
      """
    And I have a "dist/site/about/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/base.json" containing the values:
      | version                           | int:2 |
      | keys.seal.pages.index\.html       | int:1 |
      | keys.seal.pages.about/index\.html | int:2 |
      | keys.seal.total                   | int:3 |
      | keys.sting.pages.index\.html      | int:1 |
      | keys.sting.total                  | int:1 |
