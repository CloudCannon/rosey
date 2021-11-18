Feature: Rosey Base

  Scenario: Rosey Cucumber tests are working
    Given I have a "rosey/locales/stub" file
    And I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p>Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run Rosey
    Then I should see a selector 'a' in "dest/index.html" with the attributes:
      | innerText | Click here if you are not redirected. |
      | href | /en/ |
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
