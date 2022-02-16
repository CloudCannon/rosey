Feature: Rosey Build Complex

  Scenario: Rosey build includes whitespace
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">
      Kiss From A Rose
      </p>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      {
        "seal": "\n  \n  Kiss  From  A  Rose\n"
      }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal                 |
      | innerText  | \nKiss From A Rose\n |
    And I should see a selector 'p' in "dist/translated_site/airy/index.html" with the attributes:
      | data-rosey | seal                          |
      | innerText  | \n  \n  Kiss  From  A  Rose\n |

  Scenario: Rosey build includes HTML
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      {
        "seal": "<p>Kiss From A <span class='rose'>Rose</span></p>"
      }
      """
    When I run Rosey build
    Then I should see a selector 'div > p' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'div > p > span' in "dist/translated_site/airy/index.html" with the attributes:
      | class     | rose |
      | innerText | Rose |

  Scenario: Rosey build includes utf8
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">🦭</p>
      <p data-rosey="e">𓀞𓂗𓃛𓄫𓋟</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/hmm.json" file with the content:
      """
      {
        "e": "𓆔𓆫𓆿",
        "seal": "c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲"
      }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 🦭   |
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | e          |
      | innerText  | 𓀞𓂗𓃛𓄫𓋟 |
    And I should see a selector 'p' in "dist/translated_site/hmm/index.html" with the attributes:
      | data-rosey | seal                   |
      | innerText  | c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲ |
    And I should see a selector 'p' in "dist/translated_site/hmm/index.html" with the attributes:
      | data-rosey | e      |
      | innerText  | 𓆔𓆫𓆿 |

  Scenario: Rosey build includes utf8 keys
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="🦭">seal</p>
      <p data-rosey="אֱלֹהִים">e</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/rtl.json" file with the content:
      """
      {
        "אֱלֹהִים": "١٢٣",
        "🦭": "بين ما, يذكر"
      }
      """
    # 👆 This whole line is RTL, it's likely rendering as
    # { "value" :"key" ,"value" :"key" }
    When I run Rosey build
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | 🦭   |
      | innerText  | seal |
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText  | e        |
    And I should see a selector 'p' in "dist/translated_site/rtl/index.html" with the attributes:
      | data-rosey | 🦭           |
      | innerText  | بين ما, يذكر |
    And I should see a selector 'p' in "dist/translated_site/rtl/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText  | ١٢٣      |

  Scenario: Rosey build works with complex directories
    Given I have a "build/source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-i18n="seal">Kiss From A Rose</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/test.json" file with the content:
      """
      {
        "seal": "Test"
      }
      """
    When I run Rosey build with options:
      | source        | build/source    |
      | dest          | build/dest      |
      | images-source | src             |
      | locale-source | ./rosey/locales |
      | tag           | data-i18n       |
      | version       | 1               |
    Then I should see a selector 'p' in "build/dest/en/index.html" with the attributes:
      | data-i18n | seal             |
      | innerText | Kiss From A Rose |
    And I should see a selector 'p' in "build/dest/test/index.html" with the attributes:
      | data-i18n | seal |
      | innerText | Test |