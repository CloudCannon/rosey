Feature: Rosey Build Word Wrap
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey build does not word wrap languages by default
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">Hello World</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/ja-jp.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "こんにちは世界"
        }
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | p           |
      | innerText  | Hello World |
    Then I should not see a selector 'p > span' in "dist/translated_site/en/index.html"
    Then I should see a selector 'p' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | data-rosey | p              |
      | innerText  | こんにちは世界 |
    Then I should not see a selector 'p > span' in "dist/translated_site/ja-jp/index.html"

  Scenario: Rosey build can word wrap languages with inline styles
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">Hello World</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/ja-jp.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "こんにちは世界"
        }
      }
      """
    When I run my program with the flags:
      | build          |
      | --wrap "ja-jp" |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | p           |
      | innerText  | Hello World |
    Then I should not see a selector 'p > span' in "dist/translated_site/en/index.html"
    Then I should see a selector 'p' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | data-rosey | p              |
      | innerText  | こんにちは世界 |
    Then I should see a selector 'p > span:nth-of-type(1)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | こんにちは           |
    Then I should see a selector 'p > span:nth-of-type(2)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | 世界                 |

  Scenario: Rosey build can word wrap with classes instead of inline styles
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">Hello World</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/ja-jp.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "こんにちは世界"
        }
      }
      """
    When I run my program with the flags:
      | build                   |
      | --wrap "ja-jp"          |
      | --wrap-class "my-class" |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | p           |
      | innerText  | Hello World |
    Then I should not see a selector 'p > span' in "dist/translated_site/en/index.html"
    Then I should see a selector 'p' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | data-rosey | p              |
      | innerText  | こんにちは世界 |
    Then I should see a selector 'p > span:nth-of-type(1)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | class     | my-class   |
      | innerText | こんにちは |
    Then I should see a selector 'p > span:nth-of-type(2)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | class     | my-class |
      | innerText | 世界     |

  Scenario: Rosey build can word wrap chinese, hebrew and thai
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">Hello World</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/zh-hans-tw.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "你好世界"
        }
      }
      """
    And I have a "rosey/locales/he.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "שלום עולם"
        }
      }
      """
    And I have a "rosey/locales/th.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "สวัสดีชาวโลก"
        }
      }
      """
    When I run my program with the flags:
      | build                         |
      | --wrap "zh-hans-tw" "he" "th" |
    Then I should see a selector 'p > span:nth-of-type(1)' in "dist/translated_site/zh-hans-tw/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | 你好                 |
    Then I should see a selector 'p > span:nth-of-type(2)' in "dist/translated_site/zh-hans-tw/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | 世界                 |
    Then I should see a selector 'p > span:nth-of-type(1)' in "dist/translated_site/he/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | שלום                 |
    Then I should see a selector 'p > span:nth-of-type(2)' in "dist/translated_site/he/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | עולם                 |
    Then I should see a selector 'p > span:nth-of-type(1)' in "dist/translated_site/th/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | สวัสดี                 |
    Then I should see a selector 'p > span:nth-of-type(2)' in "dist/translated_site/th/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | ชาวโลก               |

  Scenario: Rosey build doesn't wrap languages with whitespace
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">Hello World</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "p": {
          "original": "Hello World",
          "value": "Bonjour le monde"
        }
      }
      """
    When I run my program with the flags:
      | build       |
      | --wrap "fr" |
    Then I should see "Cannot wrap text for language 'fr'. Languages with supported text wrapping:" in stderr

  Scenario: Rosey build can word wrap inner HTML
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
        <div data-rosey="p">
          <p>Hello World</p>
        </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/ja-jp.json" file with the content:
      """
      {
        "p": {
          "original": "<p>Hello World</p>",
          "value": "<p>こんにちは世界</p>"
        }
      }
      """
    When I run my program with the flags:
      | build          |
      | --wrap "ja-jp" |
    Then I should see a selector 'div > p > span:nth-of-type(1)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | こんにちは           |
    Then I should see a selector 'div > p > span:nth-of-type(2)' in "dist/translated_site/ja-jp/index.html" with the attributes:
      | style     | white-space: nowrap; |
      | innerText | 世界                 |
