Feature: Rosey Generate Complex
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey generates locales [ns, root, attr, explicit-attr]
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <head data-rosey-root='home:meta'>
      <title data-rosey='title'>Home header title</title>
      </head>
      <body data-rosey-ns='home:content'>
      <h1 data-rosey="title">Home page title</h1>
      <h2 data-rosey="subtitle" data-rosey-attrs="content,alt" content="Content attribute" alt="alt attribute">Home page subtitle</h2>
      <div data-rosey-root="home:contact">
      <p data-rosey="contact-us">Contact content</p>
      <h3 data-rosey-attrs-explicit='{"content":"content-tag","alt":"alt-tag"}' content="Content attribute" alt="alt attribute">Contact title</h3>
      </div>
      <div data-rosey-root="">
      <p data-rosey="footer">Footer content</p>
      </div>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/base.json" containing the values:
      | version                                      | int:2              |
      | keys.home:meta:title.original                | Home header title  |
      | keys.home:content:title.original             | Home page title    |
      | keys.home:content:subtitle.original          | Home page subtitle |
      | keys.home:content:subtitle\.content.original | Content attribute  |
      | keys.home:content:subtitle\.alt.original     | alt attribute      |
      | keys.home:contact:contact-us.original        | Contact content    |
      | keys.home:contact:content-tag.original       | Content attribute  |
      | keys.home:contact:alt-tag.original           | alt attribute      |
      | keys.footer.original                         | Footer content     |

  Scenario: Rosey namespace applies to self element
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="b" data-rosey-ns="a">c</p>
      <p data-rosey-ns="one" data-rosey-attrs-explicit='{"alt":"two"}' alt="three"></p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/base.json" containing the values:
      | version               | int:2 |
      | keys.a:b.original     | c     |
      | keys.one:two.original | three |

  Scenario: Rosey root applies to self element
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey-root="1" data-rosey="2">3</p>
      <p data-rosey-attrs-explicit='{"alt":"two"}' alt="three" data-rosey-root="one"></p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/base.json" containing the values:
      | version               | int:2 |
      | keys.1:2.original     | 3     |
      | keys.one:two.original | three |
