Feature: Rosey Base

  Scenario: Rosey build is working
    Given I have a "rosey/locales/stub" file
    And I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p>Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run Rosey build
    Then I should see a selector 'a' in "dest/index.html" with the attributes:
      | innerText | Click here if you are not redirected. |
      | href | /en/ |
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |

  Scenario: Rosey generate is working
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see the path 'version' containing 2 in "rosey/source.json"
    And I should see the path 'keys.seal.original' containing 'Kiss From A Rose' in "rosey/source.json"
    And I should see the path 'keys.seal.pages.index\.html' containing 1 in "rosey/source.json"
