Feature: Rosey Generate AutoID

  Scenario: Rosey generate creates a hash id if none supplied
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey>rose!</p>
      </body>
      </html>
      """
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/source.json" containing the values:
      | version                                                   | int:2 |
      | keys.GtSzGc6Rr44nj796fYIRTDxQNRua2jzNIeF2qU3kpFI.original | rose! |

  Scenario: Rosey generate creates a hash id from complex input
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
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/source.json" containing the values:
      | version                                                   | int:2                                                             |
      | keys.9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg.original | \n<ul>\n<li>rose!</li>\n<li>🦭</li>\n<li>𓀞𓂗𓃛𓄫𓋟</li>\n</ul>\n |

  Scenario: Rosey generate creates a hash id with correct roots
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
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/source.json" containing the values:
      | version                                                        | int:2                                                             |
      | keys.root:9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg.original | \n<ul>\n<li>rose!</li>\n<li>🦭</li>\n<li>𓀞𓂗𓃛𓄫𓋟</li>\n</ul>\n |

  Scenario: Rosey generate creates a hash id with correct namespaces
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
    When I run my program with the flags:
      | generate |
    Then I should see "rosey/source.json" containing the values:
      | version                                                             | int:2                                                             |
      | keys.namespace:9s5+3OQ6KpQAUqk+khpX4zXwBHgihsHSQblgDfFZ7Bg.original | \n<ul>\n<li>rose!</li>\n<li>🦭</li>\n<li>𓀞𓂗𓃛𓄫𓋟</li>\n</ul>\n |