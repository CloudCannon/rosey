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

  Scenario: Rosey build handles missing translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal">Kiss From A Rose</div>
      </body>
      </html>
      """
    And I have a "rosey/locales/ohno.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'div' in "dist/translated_site/ohno/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    But I should not see a selector 'div>div' in "dist/translated_site/ohno/index.html"

  Scenario: Rosey build handles missing HTML translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><div>Kiss From A Rose</div></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/ohno.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'div' in "dist/translated_site/ohno/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    And I should see a selector 'div>div' in "dist/translated_site/ohno/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    But I should not see a selector 'div>div>div' in "dist/translated_site/ohno/index.html"
    And I should not see a selector 'div>div>div:nth-of-type(2)' in "dist/translated_site/ohno/index.html"