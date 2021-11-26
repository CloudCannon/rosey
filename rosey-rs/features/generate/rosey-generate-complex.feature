Feature: Rosey Generate Complex

  Scenario: Rosey generate includes whitespace
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
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version            | int:2                  |
      | keys.seal.original | \n  Kiss From A Rose\n |

  Scenario: Rosey generate includes HTML
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version            | int:2                   |
      | keys.seal.original | <p>Kiss From A Rose</p> |

  Scenario: Rosey generate includes utf8
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">🦭</p>
      <p data-rosey="e">𓀞𓂗𓃛𓄫𓋟</p>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version            | int:2      |
      | keys.seal.original | 🦭          |
      | keys.e.original    | 𓀞𓂗𓃛𓄫𓋟  | 

  Scenario: Rosey generate includes utf8 keys
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="🦭">seal</p>
      <p data-rosey="𓀞𓂗𓃛𓄫𓋟">e</p>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                 | int:2 |
      | keys.🦭.original         |  seal |
      | keys.𓀞𓂗𓃛𓄫𓋟.original | e     | 
