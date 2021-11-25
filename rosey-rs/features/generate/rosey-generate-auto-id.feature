Feature: Rosey Generate AutoID

  Scenario: Rosey generate creates a hash id if none supplied
    Given I have a "source/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey>rose!</p>
      </body>
      </html>
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                                                   | int:2 |
      | keys.GtSzGc6Rr44nj796fYIRTDxQNRua2jzNIeF2qU3kpFI.original | rose! |