Feature: Rosey Translated Links
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1><a href="/posts/hello-world">Hello World</a></h1>
      <h2><a href="/posts/hello-world/">Hello World Trailing Slash</a></h2>
      <h3><a href="/posts/hello-world/index.html">Hello World Direct Index Link</a></h3>
      <h4><a href="posts/hello-world/">Hello World Relative</a></h4>
      <h5><a href="/posts/foobar">Foobar</a></h5>
      <h6><a href="/posts/foobar/">Foobar Trailing Slash</a></h6>
      <h7><a href="/posts/foobar/index.html">Foobar Direct Index Link</a></h7>
      </body>
      </html>
      """
    And I have a "dist/site/posts/hello-world/index.html" file with the content:
      """
      <html>
      <body>
      <h1>Hello</h1>
      <h2><a href="/posts/foobar/">Foobar Trailing Slash</a></h2>
      </body>
      </html>
      """
    And I have a "dist/site/posts/foobar/index.html" file with the content:
      """
      <html>
      <body>
      <h1>Hello</h1>
      </body>
      </html>
      """
    And I have a "rosey/locales/cool.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/cool.urls.json" file with the content:
      """
      {
        "index.html": {
          "original": "index.html",
          "value": "index.html"
        },
        "posts/hello-world/index.html": {
          "original": "posts/hello-world/index.html",
          "value": "radical-articles/sup-world/index.html"
        },
        "posts/foobar/index.html": {
          "original": "posts/foobar/index.html",
          "value": "radical-articles/foobar/foobar.html"
        }
      }
      """

  Scenario: Rosey updates internal links using translation keys
    When I run my program with the flags:
      | build |
    Then I should see a selector 'h1>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/sup-world/ |
      | innerText | Hello World                       |
    Then I should see a selector 'h2>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/sup-world/ |
      | innerText | Hello World Trailing Slash        |
    Then I should see a selector 'h3>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/sup-world/ |
      | innerText | Hello World Direct Index Link     |
    Then I should see a selector 'h4>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | posts/hello-world/   |
      | innerText | Hello World Relative |
    Then I should see a selector 'h5>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/foobar/foobar.html |
      | innerText | Foobar                                    |
    Then I should see a selector 'h6>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/foobar/foobar.html |
      | innerText | Foobar Trailing Slash                     |
    Then I should see a selector 'h7>a' in "dist/translated_site/cool/index.html" with the attributes:
      | href      | /cool/radical-articles/foobar/foobar.html |
      | innerText | Foobar Direct Index Link                  |
    Then I should see a selector 'h2>a' in "dist/translated_site/cool/radical-articles/sup-world/index.html" with the attributes:
      | href      | /cool/radical-articles/foobar/foobar.html |
      | innerText | Foobar Trailing Slash                     |

  Scenario: Rosey updates meta urls using translation keys
    When I run my program with the flags:
      | build |
    Then I should see a selector 'link' in "dist/translated_site/posts/hello-world/index.html" with the attributes:
      | rel      | alternate                         |
      | href     | /cool/radical-articles/sup-world/ |
      | hreflang | cool                              |

    Then I should see a selector 'link' in "dist/translated_site/en/posts/hello-world/index.html" with the attributes:
      | rel      | alternate                         |
      | href     | /cool/radical-articles/sup-world/ |
      | hreflang | cool                              |
    Then I should see a selector 'link' in "dist/translated_site/cool/radical-articles/sup-world/index.html" with the attributes:
      | rel      | alternate              |
      | href     | /en/posts/hello-world/ |
      | hreflang | en                     |

  Scenario: Rosey generates redirects with translation keys
    When I run my program with the flags:
      | build                     |
      | --default-language "cool" |
    Then I should see a selector 'a' in "dist/translated_site/posts/hello-world/index.html" with the attributes:
      | href      | /cool/radical-articles/sup-world/     |
      | innerText | Click here if you are not redirected. |

  Scenario: Rosey generates canonicals with translation keys
    When I run my program with the flags:
      | build                     |
      | --default-language "cool" |
    Then I should see a selector 'link' in "dist/translated_site/posts/hello-world/index.html" with the attributes:
      | rel      | canonical                         |
      | href     | /cool/radical-articles/sup-world/ |
      | hreflang | cool                              |
