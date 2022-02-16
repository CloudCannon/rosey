Feature: Rosey Build AutoID

  Scenario: Rosey build re-pairs a hash id
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey>rose!</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/reversed.json" file with the content:
      """
      {
        "GtSzGc6Rr44nj796fYIRTDxQNRua2jzNIeF2qU3kpFI": "jack!"
      }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey |       |
      | innerText  | rose! |
    And I should see a selector 'p' in "dist/translated_site/reversed/index.html" with the attributes:
      | data-rosey |       |
      | innerText  | jack! |

  Scenario: Rosey build re-pairs a hash id from complex input
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey>
      <ul>
      <li>rose!</li>
      <li>🦭</li>
      <li>𓀞𓂗𓃛𓄫𓋟</li>
      </ul>
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/simple.json" file with the content:
      """
      {
        "9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg": "emptyish"
      }
      """
    When I run Rosey build
    Then DEBUG I should see a selector 'div > ul > li' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div' in "dist/translated_site/simple/index.html" with the attributes:
      | data-rosey |          |
      | innerText  | emptyish |

  Scenario: Rosey build re-pairs a hash id with correct roots
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey-root="root">
      <div data-rosey>
      <ul>
      <li>rose!</li>
      <li>🦭</li>
      <li>𓀞𓂗𓃛𓄫𓋟</li>
      </ul>
      </div>
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/simple.json" file with the content:
      """
      {
        "root:9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg": "emptyish"
      }
      """
    When I run Rosey build
    Then I should see a selector 'div > div > ul > li' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div > div' in "dist/translated_site/simple/index.html" with the attributes:
      | data-rosey |          |
      | innerText  | emptyish |

  Scenario: Rosey build re-pairs a hash id with correct namespaces
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey-ns="namespace">
      <div data-rosey>
      <ul>
      <li>rose!</li>
      <li>🦭</li>
      <li>𓀞𓂗𓃛𓄫𓋟</li>
      </ul>
      </div>
      </div>
      </body>
      </html>
      """
    And I have a "rosey/locales/simple.json" file with the content:
      """
      {
        "namespace:9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg": "emptyish"
      }
      """
    When I run Rosey build
    Then I should see a selector 'div > div > ul > li' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div > div' in "dist/translated_site/simple/index.html" with the attributes:
      | data-rosey |          |
      | innerText  | emptyish |
