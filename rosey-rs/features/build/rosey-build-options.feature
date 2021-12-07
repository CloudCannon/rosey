Feature: Rosey Build Options

  Scenario: Rosey builds with custom separators
    Given I have a "source/index.html" file with the content:
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
    When I run Rosey build with options:
      | separator | ~ |
    Then I should see a selector 'title' in "dest/cc/index.html" with the attributes:
      | data-rosey | title |
      | innerText | 🥩 |
    And I should see a selector 'h1' in "dest/cc/index.html" with the attributes:
      | data-rosey | title |
      | innerText | 🏚️ |
    And I should see a selector 'p' in "dest/cc/index.html" with the attributes:
      | data-rosey | contact-us |
      | innerText | 🇺🇸 |
    And I should see a selector 'p' in "dest/cc/index.html" with the attributes:
      | data-rosey | footer |
      | innerText | 🦶 |

  Scenario: Rosey builds from custom tags
    Given I have a "source/index.html" file with the content:
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
    When I run Rosey build with options:
      | tag | something-else |
    Then I should see a selector 'title' in "dest/s-e/index.html" with the attributes:
      | something-else | title |
      | innerText | 🥩 |
    And I should see a selector 'h1' in "dest/s-e/index.html" with the attributes:
      | something-else | title |
      | innerText | 🏚️ |
    And I should see a selector 'p' in "dest/s-e/index.html" with the attributes:
      | something-else | contact-us |
      | innerText | 🇺🇸 |
    And I should see a selector 'p' in "dest/s-e/index.html" with the attributes:
      | something-else | footer |
      | innerText | 🦶 |

  Scenario: Rosey builds from a custom locale source
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "cloud/cannon.json" file with the content:
      """
      { "seal": "👄🌹" }
      """
    When I run Rosey build with options:
      | locale-source | cloud |
    Then I should see a selector 'title' in "dest/index.html" with the attributes:
      | innerText | Redirecting... |
    And I should see a selector 'a' in "dest/index.html" with the attributes:
      | href | /en/ |
      | innerText | Click here if you are not redirected. |
    And I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | Kiss From A Rose |
    And I should see a selector 'p' in "dest/cannon/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | 👄🌹 |
