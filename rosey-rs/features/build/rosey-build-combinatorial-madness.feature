Feature: Rosey Build Combinatorial

  Scenario: Rosey builds from source.json [ns, root, attr, explicit-attr]
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
    And I have a "rosey/locales/test.json" file with the content:
      """
      {
        "home:meta:title": "one",
        "home:content:title": "two",
        "home:content:subtitle": "three",
        "home:content:subtitle.content": "four",
        "home:content:subtitle.alt": "five",
        "home:contact:contact-us": "six",
        "home:contact:content-tag": "seven",
        "home:contact:alt-tag": "eight",
        "footer": "nine"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector '[data-rosey]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey | title |
      | innerText  | one   |
    Then I should see a selector '[data-rosey]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey | title |
      | innerText  | two   |
    Then I should see a selector '[data-rosey]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey       | subtitle    |
      | data-rosey-attrs | content,alt |
      | innerText        | three       |
      | content          | four        |
      | alt              | five        |
    Then I should see a selector '[data-rosey]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey | contact-us |
      | innerText  | six        |
    Then I should see a selector '[data-rosey-attrs-explicit]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey-attrs-explicit | {"content":"content-tag","alt":"alt-tag"} |
      | content                   | seven                                     |
      | alt                       | eight                                     |
      | innerText                 | Contact title                             |
    Then I should see a selector '[data-rosey]' in "dist/translated_site/test/index.html" with the attributes:
      | data-rosey | footer |
      | innerText  | nine   |
