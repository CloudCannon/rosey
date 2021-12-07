Feature: Rosey Build AutoID

  Scenario: Rosey build re-pairs a hash id
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey>rose!</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/reversed.json" file with the content:
      """
      { "GtSzGc6Rr44nj796fYIRTDxQNRua2jzNIeF2qU3kpFI": "jack!" }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dest/en/index.html" with the attributes:
      | data-rosey ||
      | innerText | rose! |
    And I should see a selector 'p' in "dest/reversed/index.html" with the attributes:
      | data-rosey ||
      | innerText | jack! |

  Scenario: Rosey build re-pairs a hash id from complex input
    Given I have a "source/index.html" file with the content:
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
      { "2ncxJRhmNutvN2YmbMHGSWyJVRCG5smK4+7e2JV/Nl0": "emptyish" }
      """
    When I run Rosey build
    Then I should see a selector 'div > ul > li' in "dest/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div' in "dest/simple/index.html" with the attributes:
      | data-rosey ||
      | innerText | emptyish |

  Scenario: Rosey build re-pairs a hash id with correct roots
    Given I have a "source/index.html" file with the content:
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
      { "root:2ncxJRhmNutvN2YmbMHGSWyJVRCG5smK4+7e2JV/Nl0": "emptyish" }
      """
    When I run Rosey build
    Then I should see a selector 'div > div > ul > li' in "dest/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div > div' in "dest/simple/index.html" with the attributes:
      | data-rosey ||
      | innerText | emptyish |

  Scenario: Rosey build re-pairs a hash id with correct namespaces
    Given I have a "source/index.html" file with the content:
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
      { "namespace:2ncxJRhmNutvN2YmbMHGSWyJVRCG5smK4+7e2JV/Nl0": "emptyish" }
      """
    When I run Rosey build
    Then I should see a selector 'div > div > ul > li' in "dest/en/index.html" with the attributes:
      | innerText | 🦭 |
    And I should see a selector 'div > div' in "dest/simple/index.html" with the attributes:
      | data-rosey ||
      | innerText | emptyish |
