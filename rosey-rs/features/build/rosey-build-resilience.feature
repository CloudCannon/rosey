Feature: Rosey Build Resilience

  Scenario: Rosey build ignores images without a src
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      <img />
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 👄🌹 |

  Scenario: Complex HTML translation
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      {
        "seal": "<!--Comment--><!DOCTYPE html><video loop /><p>Kiss From A <span class='rose'>Rose</span></p>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div > p' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'div > video' in "dist/translated_site/airy/index.html" with the attributes:
      | loop |  |
    And I should see '<!--Comment-->' in "dist/translated_site/airy/index.html"
    And I should see '<!DOCTYPE html>' in "dist/translated_site/airy/index.html"