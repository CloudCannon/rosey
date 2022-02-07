Feature: Rosey Build Assets

  Scenario: Rosey build copies assets
    Given I have a "source/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see the file "dest/image.png"

  Scenario: Rosey build doesn't copy a default set of assets
    Given I have a "source/about.htm" file with the content:
      """
      <html>
      </html>
      """
    And I have a "source/about.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    And I should not see the file "dest/about.htm"
    And I should not see the file "dest/about.json"

  Scenario: Rosey build doesn't copy excluded assets
    Given I have a "source/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | exclusions | \.[png]{3} |
    Then I should not see the file "dest/image.png"

  Scenario: Rosey build exclusion overrides default
    Given I have a "source/about.htm" file with the content:
      """
      <html>
      </html>
      """
    And I have a "source/about.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | exclusions | \.[png]{3} |
    Then I should see the file "dest/about.htm"
    And I should see the file "dest/about.json"
