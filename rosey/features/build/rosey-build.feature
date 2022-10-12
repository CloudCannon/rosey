Feature: Rosey Build
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey builds from locales
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
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
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    And I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 👄🌹 |

  Scenario: Rosey build from locale files with attrs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey="title" data-rosey-attrs="content,alt" content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "title": "🏡📃",
        "title.content": "🛂",
        "title.alt": "〽️"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'h1' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey       | title             |
      | data-rosey-attrs | content,alt       |
      | content          | Content attribute |
      | alt              | alt attribute     |
      | innerText        | Home page title   |
    And I should see a selector 'h1' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey       | title       |
      | data-rosey-attrs | content,alt |
      | content          | 🛂          |
      | alt              | 〽️         |
      | innerText        | 🏡📃        |

  Scenario: Rosey builds from locale files with explicit attrs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey-attrs-explicit='{"content":"content-tag","alt":"alt-tag"}' content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "content-tag": "🎛️",
        "alt-tag": "⚗️"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'h1' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey-attrs-explicit | {"content":"content-tag","alt":"alt-tag"} |
      | content                   | Content attribute                         |
      | alt                       | alt attribute                             |
      | innerText                 | Home page title                           |
    And I should see a selector 'h1' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey-attrs-explicit | {"content":"content-tag","alt":"alt-tag"} |
      | content                   | 🎛️                                       |
      | alt                       | ⚗️                                        |
      | innerText                 | Home page title                           |

  Scenario: Rosey builds from locale files with namespaces
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
    And I have a "rosey/locales/numeric.json" file with the content:
      """
      {
        "about:faq:row-0:col-0:title": "5107 [1]",
        "about:faq:row-1:col-0:title": "5107 [2]",
        "about:benefits:row-0:col-0:title": "5107 [3]",
        "about:benefits:row-1:col-0:title": "5107 [4]"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | title  |
      | innerText  | Slot A |
    Then I should see a selector 'div' in "dist/translated_site/numeric/index.html" with the attributes:
      | data-rosey | title    |
      | innerText  | 5107 [1] |
    Then I should see a selector 'div' in "dist/translated_site/numeric/index.html" with the attributes:
      | data-rosey | title    |
      | innerText  | 5107 [2] |
    Then I should see a selector 'div' in "dist/translated_site/numeric/index.html" with the attributes:
      | data-rosey | title    |
      | innerText  | 5107 [3] |
    Then I should see a selector 'div' in "dist/translated_site/numeric/index.html" with the attributes:
      | data-rosey | title    |
      | innerText  | 5107 [4] |

  Scenario: Rosey builds from locale files with roots
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
    And I have a "rosey/locales/uuids.json" file with the content:
      """
      {
        "home:meta:title": "13a534d8-6f32-4c61-bece-57fa891e2aff",
        "home:content:title": "1be5b79b-5b15-4348-b9de-e87ab2f8e304",
        "home:contact:contact-us": "43362cf1-9c20-4b06-995a-57f3b5062bc2",
        "footer": "b4a8eccc-4408-4d18-82aa-9d52ece1e113"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | contact-us      |
      | innerText  | Contact content |
    Then I should see a selector 'title' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | title                                |
      | innerText  | 13a534d8-6f32-4c61-bece-57fa891e2aff |
    Then I should see a selector 'h1' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | title                                |
      | innerText  | 1be5b79b-5b15-4348-b9de-e87ab2f8e304 |
    Then I should see a selector 'p' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | contact-us                           |
      | innerText  | 43362cf1-9c20-4b06-995a-57f3b5062bc2 |
    Then I should see a selector 'p' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | footer                               |
      | innerText  | b4a8eccc-4408-4d18-82aa-9d52ece1e113 |

  Scenario: Rosey builds from locale files with mixed roots and namespaces
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
        <body data-rosey-ns='home'>
          <h1 data-rosey="title">Home page title</h1>
          <div data-rosey-root="contact">
            <p data-rosey="contact-us">Contact content</p>
            <div data-rosey-ns="inner">
              <p data-rosey="author">CloudCannon</p>
            </div>
          </div>
        </body>
      </html>
      """
    And I have a "rosey/locales/uuids.json" file with the content:
      """
      {
        "home:title": "13a534d8-6f32-4c61-bece-57fa891e2aff",
        "contact:contact-us": "1be5b79b-5b15-4348-b9de-e87ab2f8e304",
        "contact:inner:author": "43362cf1-9c20-4b06-995a-57f3b5062bc2"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | author      |
      | innerText  | CloudCannon |
    Then I should see a selector 'h1' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | title                                |
      | innerText  | 13a534d8-6f32-4c61-bece-57fa891e2aff |
    Then I should see a selector 'p' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | contact-us                           |
      | innerText  | 1be5b79b-5b15-4348-b9de-e87ab2f8e304 |
    Then I should see a selector 'p' in "dist/translated_site/uuids/index.html" with the attributes:
      | data-rosey | author                               |
      | innerText  | 43362cf1-9c20-4b06-995a-57f3b5062bc2 |
