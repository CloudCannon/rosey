Feature: Rosey Build Complex

  Scenario: Rosey build includes whitespace
    Given I have a "source/index.html" file with the content:
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
      { "seal": "\n  \n  Kiss  From  A  Rose\n" }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | \n  Kiss From A Rose\n |
    And I should see a selector 'p' in "dest/airy/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | \n  \n  Kiss  From  A  Rose\n |

  Scenario: Rosey build includes HTML
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      { "seal": "<p>Kiss From A <span class='rose'>Rose</span></p>" }
      """
    When I run Rosey build
    Then I should see a selector 'div > p' in "dest/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'div > p > span' in "dest/airy/index.html" with the attributes:
      | class | rose |
      | innerText | Rose |

  Scenario: Rosey build includes utf8
    Given I have a "source/index.html" file with the content:
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
      { "e": "𓆔𓆫𓆿", "seal": "c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲" }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | 🦭 |
    And I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | e |
      | innerText | 𓀞𓂗𓃛𓄫𓋟 |
    And I should see a selector 'p' in "dest/hmm/index.html" with the attributes:
      | data-rosey | seal |
      | innerText | c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲ |
    And I should see a selector 'p' in "dest/hmm/index.html" with the attributes:
      | data-rosey | e |
      | innerText | 𓆔𓆫𓆿 |

  Scenario: Rosey build includes utf8 keys
    Given I have a "source/index.html" file with the content:
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
      { "אֱלֹהִים": "١٢٣", "🦭": "بين ما, يذكر" }
      """
    # 👆 This whole line is RTL, it's likely rendering as
    # { "value" :"key" ,"value" :"key" }
    When I run Rosey build
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | 🦭 |
      | innerText | seal |
    And I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText | e |
    And I should see a selector 'p' in "dest/rtl/index.html" with the attributes:
      | data-rosey | 🦭 |
      | innerText | بين ما, يذكر |
    And I should see a selector 'p' in "dest/rtl/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText | ١٢٣ |

