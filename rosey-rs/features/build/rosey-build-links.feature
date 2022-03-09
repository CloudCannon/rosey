Feature: Rosey Links

  Scenario: Rosey updates internal links
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1><a href="/">Home</a></h1>
      <h2><a href="/posts/hello-world">Hello World</a></h2>
      <h3><a href="/posts/hello-world/">Hello World Trailing Slash</a></h3>
      <h4><a href="/posts/hello-world.png">Hello World Asset</a></h4>
      <h5><a href="posts/hello-world/">Hello World Relative</a></h5>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'h1>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/ |
      | innerText | Home    |
    Then I should see a selector 'h2>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/posts/hello-world |
      | innerText | Hello World              |
    Then I should see a selector 'h3>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/posts/hello-world/  |
      | innerText | Hello World Trailing Slash |
    Then I should see a selector 'h4>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /posts/hello-world.png |
      | innerText | Hello World Asset      |
    Then I should see a selector 'h5>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | posts/hello-world/   |
      | innerText | Hello World Relative |

  Scenario: Rosey doesn't update links already pointing to a locale
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1><a href="/blink/hello">Hello</a></h1>
      <h2><a href="/blank/hello">Hello</a></h2>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'h1>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/blink/hello |
      | innerText | Hello              |
    Then I should see a selector 'h2>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/hello |
      | innerText | Hello        |
