Feature: Rosey Build Resilience
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

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

  Scenario: Rosey build doesn't break in translation img srcs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="container">
        <img src="https://ryancollins.website/images/rodents/souslik.png" />
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "container": {
          "original": "<img src=\"https://ryancollins.website/images/rodents/souslik.png\">",
          "value": "<img src=\"https://ryancollins.website/images/rodents/souslik.png\">"
        }
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src | https://ryancollins.website/images/rodents/souslik.png |

  Scenario: Rosey builds from locales with templates
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <template>
      <p data-rosey="seal">Kiss From A Rose</p>
      </template>
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
    Then I should see a selector 'title' in "dist/translated_site/index.html" with the attributes:
      | innerText | Redirecting... |
    And I should see a selector 'a' in "dist/translated_site/index.html" with the attributes:
      | href      | /en/                                  |
      | innerText | Click here if you are not redirected. |
    And I should see '<template>' in "dist/translated_site/en/index.html"
    And I should see '<p data-rosey="seal">Kiss From A Rose</p>' in "dist/translated_site/en/index.html"
    And I should see '<template>' in "dist/translated_site/em/index.html"
    And I should see '<p data-rosey="seal">👄🌹</p>' in "dist/translated_site/em/index.html"