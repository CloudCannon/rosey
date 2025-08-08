Feature: Rosey Links
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

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
      <h6><a href="/posts/hello-world.html">Hello World Extension</a></h6>
      <h7><a href="/posts/hello-world/#title">Hello World Anchor</a></h7>
      <h8><a href="/posts/hello-world.html?q=a">Hello World Query</a></h8>
      <h9><a href="/blank-posts/hello-world.html?q=a">Should not match blank locale</a></h9>
      <h10><a href="/blank/hello-world.html?q=a">Stay the same</a></h10>
      <h11><a href="/blank">Stay the same</a></h11>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
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
    Then I should see a selector 'h6>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/posts/hello-world.html |
      | innerText | Hello World Extension         |
    Then I should see a selector 'h7>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/posts/hello-world/#title |
      | innerText | Hello World Anchor              |
    Then I should see a selector 'h8>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/posts/hello-world.html?q=a |
      | innerText | Hello World Query                 | 
    Then I should see a selector 'h9>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/blank-posts/hello-world.html?q=a |
      | innerText | Should not match blank locale            |
    Then I should see a selector 'h10>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/hello-world.html?q=a |
      | innerText | Stay the same               |
    Then I should see a selector 'h11>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank                      |
      | innerText | Stay the same               |


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
    When I run my program with the flags:
      | build |
    Then I should see a selector 'h1>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/blink/hello |
      | innerText | Hello              |
    Then I should see a selector 'h2>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href      | /blank/hello |
      | innerText | Hello        |


  Scenario: Rosey can ignore links
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <h1><a data-rosey-ignore href="/">Home</a></h1>
      <h2><a data-rosey-ignore href="/posts/hello-world">Hello World</a></h2>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'h1>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href              | /    |
      | data-rosey-ignore |      |
      | innerText         | Home |
    Then I should see a selector 'h2>a' in "dist/translated_site/blank/index.html" with the attributes:
      | href              | /posts/hello-world |
      | data-rosey-ignore |                    |
      | innerText         | Hello World        |
