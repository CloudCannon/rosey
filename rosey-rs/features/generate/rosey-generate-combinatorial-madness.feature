Feature: Rosey Generate Complex

  Scenario: Rosey generates source.json [ns, root, attr, explicit-attr]
    Given I have a "source/index.html" file with the content:
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
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
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
