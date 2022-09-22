Feature: Rosey Build Options
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey builds with custom source and dest
    Given I have a "happy/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/emotion.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    When I run my program with the flags:
      | build            |
      | --source "happy" |
      | --dest   "sad"   |
    Then I should see a selector 'title' in "sad/index.html" with the attributes:
      | innerText | Redirecting... |
    And I should see a selector 'a' in "sad/index.html" with the attributes:
      | href      | /en/                                  |
      | innerText | Click here if you are not redirected. |
    And I should see a selector 'p' in "sad/en/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    And I should see a selector 'p' in "sad/emotion/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 👄🌹 |

  Scenario: Rosey builds with custom separators
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <head data-rosey-root='home:meta'>
      <title data-rosey='title'>Home header title</title>
      </head>
      <body data-rosey-ns='home:content'>
      <h1 data-rosey="title">Home page title</h1>
      <div data-rosey-root="home:contact">
      <p data-rosey="contact-us">Contact content</p>
      </div>
      <div data-rosey-root="">
      <p data-rosey="footer">Footer content</p>
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/cc.json" file with the content:
      """
      {
        "home:meta~title": "🥩",
        "home:content~title": "🏚️",
        "home:contact~contact-us": "🇺🇸",
        "footer": "🦶"
      }
      """
    When I run my program with the flags:
      | build           |
      | --separator "~" |
    Then I should see a selector 'title' in "dist/translated_site/cc/index.html" with the attributes:
      | data-rosey | title |
      | innerText  | 🥩    |
    And I should see a selector 'h1' in "dist/translated_site/cc/index.html" with the attributes:
      | data-rosey | title |
      | innerText  | 🏚️   |
    And I should see a selector 'p' in "dist/translated_site/cc/index.html" with the attributes:
      | data-rosey | contact-us |
      | innerText  | 🇺🇸       |
    And I should see a selector 'p' in "dist/translated_site/cc/index.html" with the attributes:
      | data-rosey | footer |
      | innerText  | 🦶     |

  Scenario: Rosey builds from custom tags
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <head something-else-root='home:meta'>
      <title something-else='title'>Home header title</title>
      </head>
      <body something-else-ns='home:content'>
      <h1 something-else="title">Home page title</h1>
      <div something-else-root="home:contact">
      <p something-else="contact-us">Contact content</p>
      </div>
      <div something-else-root="">
      <p something-else="footer">Footer content</p>
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/s-e.json" file with the content:
      """
      {
        "home:meta:title": "🥩",
        "home:content:title": "🏚️",
        "home:contact:contact-us": "🇺🇸",
        "footer": "🦶"
      }
      """
    When I run my program with the flags:
      | build                  |
      | --tag "something-else" |
    Then I should see a selector 'title' in "dist/translated_site/s-e/index.html" with the attributes:
      | something-else | title |
      | innerText      | 🥩    |
    And I should see a selector 'h1' in "dist/translated_site/s-e/index.html" with the attributes:
      | something-else | title |
      | innerText      | 🏚️   |
    And I should see a selector 'p' in "dist/translated_site/s-e/index.html" with the attributes:
      | something-else | contact-us |
      | innerText      | 🇺🇸       |
    And I should see a selector 'p' in "dist/translated_site/s-e/index.html" with the attributes:
      | something-else | footer |
      | innerText      | 🦶     |

  Scenario: Rosey builds from a custom locale source
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "cloud/cannon.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    When I run my program with the flags:
      | build             |
      | --locales "cloud" |
    Then I should see a selector 'title' in "dist/translated_site/index.html" with the attributes:
      | innerText | Redirecting... |
    And I should see a selector 'a' in "dist/translated_site/index.html" with the attributes:
      | href      | /en/                                  |
      | innerText | Click here if you are not redirected. |
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    And I should see a selector 'p' in "dist/translated_site/cannon/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 👄🌹 |

  Scenario: Rosey builds with an alternate default language
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="goose">gander</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "goose": "👹"
      }
      """
    When I run my program with the flags:
      | build                        |
      | --default-language "poultry" |
    Then I should see a selector 'title' in "dist/translated_site/index.html" with the attributes:
      | innerText | Redirecting... |
    And I should see a selector 'a' in "dist/translated_site/index.html" with the attributes:
      | href      | /poultry/                             |
      | innerText | Click here if you are not redirected. |
    And I should see a selector 'p' in "dist/translated_site/poultry/index.html" with the attributes:
      | data-rosey | goose  |
      | innerText  | gander |
    And I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey | goose |
      | innerText  | 👹    |