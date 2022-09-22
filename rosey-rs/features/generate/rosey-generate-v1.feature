Feature: Rosey Generate v1
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey generates base.json files
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate    |
      | --version 1 |
    Then I should see "rosey/base.json" containing the values:
      | seal | Kiss From A Rose |

  Scenario: Rosey generates base.json files with attrs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey="title" data-rosey-attrs="content,alt" content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate    |
      | --version 1 |
    Then I should see "rosey/base.json" containing the values:
      | title          | Home page title   |
      | title\.content | Content attribute |
      | title\.alt     | alt attribute     |

  Scenario: Rosey generates base.json files with explicit attrs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey="title" data-rosey-attrs-explicit='{"content":"content-tag","alt":"alt-tag"}' content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate    |
      | --version 1 |
    Then I should see "rosey/base.json" containing the values:
      | content-tag | Content attribute |
      | alt-tag     | alt attribute     |

  Scenario: Rosey generates base.json files with namespaces
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey-ns="about">
      <div data-rosey-ns="faq">
      <div data-rosey-ns="row-0">
      <div data-rosey-ns="col-0">
      <div data-rosey="title">Slot A</div>
      </div>
      </div>
      <div data-rosey-ns="row-1">
      <div data-rosey-ns="col-0">
      <div data-rosey="title">Slot B</div>
      </div>
      </div>
      </div>
      <div data-rosey-ns="benefits">
      <div data-rosey-ns="row-0">
      <div data-rosey-ns="col-0">
      <div data-rosey="title">Slot C</div>
      </div>
      </div>
      <div data-rosey-ns="row-1">
      <div data-rosey-ns="col-0">
      <div data-rosey="title">Slot D</div>
      </div>
      </div>
      </div>
      </div>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate    |
      | --version 1 |
    Then I should see "rosey/base.json" containing the values:
      | about:faq:row-0:col-0:title      | Slot A |
      | about:faq:row-1:col-0:title      | Slot B |
      | about:benefits:row-0:col-0:title | Slot C |
      | about:benefits:row-1:col-0:title | Slot D |

  Scenario: Rosey generates base.json files with roots
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
    When I run my program with the flags:
      | generate    |
      | --version 1 |
    Then I should see "rosey/base.json" containing the values:
      | home:meta:title         | Home header title |
      | home:content:title      | Home page title   |
      | home:contact:contact-us | Contact content   |
      | footer                  | Footer content    |
