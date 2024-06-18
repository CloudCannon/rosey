Feature: Rosey Generate URLs
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey generates a URLs file
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
    Then I should see "rosey/base.urls.json" containing the values:
      | version                         | int:2            |
      | keys.index\.html.original       | index.html       |
      | keys.about/index\.html.original | about/index.html |
