Feature: Rosey Build Resilience

  Scenario: Rosey build ignores images without a src
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">Kiss From A Rose</p>
      <img />
      </body>
      </html>
      """
    And I have a "rosey/locales/em.json" file with the content:
      """
      {
        "seal": "👄🌹"
      }
      """
    When I run Rosey build
    Then I should see a selector 'p' in "dist/translated_site/em/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 👄🌹 |
