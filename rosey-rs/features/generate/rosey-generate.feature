Feature: Rosey Generate v2

  Scenario: Rosey generates source.json files
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version            | int:2            |
      | keys.seal.original | Kiss From A Rose |

  Scenario: Rosey generates source.json files with attrs
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey="title" data-rosey-attrs="content,alt" content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                      | int:2             |
      | keys.title.original          | Home page title   |
      | keys.title\.content.original | Content attribute |
      | keys.title\.alt.original     | alt attribute     |

  Scenario: Rosey generates source.json files with explicit attrs
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <h1 data-rosey="title" data-rosey-attrs-explicit='{"content":"content-tag","alt":"alt-tag"}' content="Content attribute" alt="alt attribute">Home page title</h1>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                   | int:2             |
      | keys.content-tag.original | Content attribute |
      | keys.alt-tag.original     | alt attribute     |

  Scenario: Rosey generates source.json files with namespaces
    Given I have a "source/index.html" file with the content:
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
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                                        | int:2  |
      | keys.about:faq:row-0:col-0:title.original      | Slot A |
      | keys.about:faq:row-1:col-0:title.original      | Slot B |
      | keys.about:benefits:row-0:col-0:title.original | Slot C |
      | keys.about:benefits:row-1:col-0:title.original | Slot D |

  Scenario: Rosey generates source.json files with roots
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
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                               | int:2             |
      | keys.home:meta:title.original         | Home header title |
      | keys.home:content:title.original      | Home page title   |
      | keys.home:contact:contact-us.original | Contact content   |
      | keys.footer.original                  | Footer content    |
