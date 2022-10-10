Feature: Rosey Build Assets
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey build copies assets
    Given I have a "dist/site/assets/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see "Pretend that I'm a png" in "dist/translated_site/assets/image.png"

  Scenario: Rosey build doesn't copy a default set of assets
    Given I have a "dist/site/about.htm" file with the content:
      """
      <html>
      </html>
      """
    And I have a "dist/site/about.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should not see the file "dist/translated_site/about.htm"
    And I should not see the file "dist/translated_site/about.json"

  Scenario: Rosey build doesn't copy excluded assets
    Given I have a "dist/site/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build                       |
      | --exclusions "\\.[png]{3}$" |
    Then I should not see the file "dist/translated_site/image.png"

  Scenario: Rosey build exclusion overrides default
    Given I have a "dist/site/about.htm" file with the content:
      """
      <html>
      </html>
      """
    And I have a "dist/site/about.json" file with the content:
      """
      {
        "ok": true
      }
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build                      |
      | --exclusions "\\.[png]{3}" |
    Then I should see the file "dist/translated_site/about.htm"
    And I should see "true" in "dist/translated_site/about.json"
