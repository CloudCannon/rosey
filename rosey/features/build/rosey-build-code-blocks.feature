Feature: Rosey Build Code Blocks
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey doesn't ruin innocent escaped code
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal">Kiss From A Rose</div>
      <pre><code>&lt;configuration&gt;&lt;setting v='true'/&gt;&lt;/configuration&gt;</code></pre>
      </body>
      </html>
      """
    And I have a "rosey/locales/manuka.json" file with the content:
      """
      {
        "seal": "Pollen From A Tree"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector '[data-rosey="seal"]' in "dist/translated_site/manuka/index.html" with the attributes:
      | data-rosey | seal               |
      | innerText  | Pollen From A Tree |
    Then I should see a selector 'pre > code' in "dist/translated_site/manuka/index.html" with the attributes:
      | innerText  | <configuration><setting v='true'/></configuration> |
