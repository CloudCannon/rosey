Feature: Rosey Generate Options

  Scenario: Rosey generates custom separators
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
    When I run Rosey generate with options:
      | separator | ~ |
    Then I should see "rosey/source.json" containing the values:
      | version                               | int:2             |
      | keys.home:meta~title.original         | Home header title |
      | keys.home:content~title.original      | Home page title   |
      | keys.home:contact~contact-us.original | Contact content   |
      | keys.footer.original                  | Footer content    |

  Scenario: Rosey generates from custom tags
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
    When I run Rosey generate with options:
      | tag | something-else |
    Then I should see "rosey/source.json" containing the values:
      | version                               | int:2             |
      | keys.home:meta:title.original         | Home header title |
      | keys.home:content:title.original      | Home page title   |
      | keys.home:contact:contact-us.original | Contact content   |
      | keys.footer.original                  | Footer content    |

  Scenario: Rosey generates to a custom dest
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run Rosey generate with options:
      | locale-dest | row-z/source.json |
    Then I should see "row-z/source.json" containing the values:
      | version            | int:2            |
      | keys.seal.original | Kiss From A Rose |
