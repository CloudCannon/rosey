Feature: Rosey Base

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
    When I run Rosey build
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
    When I run Rosey generate
    Then I should see the file "rosey/source.json"
