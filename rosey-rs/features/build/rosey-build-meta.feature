Feature: Rosey Build Redirect

  Scenario: Rosey adds alternates to meta
    Given I have a "source/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "source/about.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/nada.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should not see a selector 'link' in "dest/about.html" with the attributes:
      | rel      | alternate      |
      | href     | /en/about.html |
      | hreflang | en             |
    Then I should see a selector 'link' in "dest/about.html" with the attributes:
      | rel      | alternate         |
      | href     | /blank/about.html |
      | hreflang | blank             |
    Then I should see a selector 'link' in "dest/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |

    Then I should see a selector 'link' in "dest/en/about.html" with the attributes:
      | rel      | alternate         |
      | href     | /blank/about.html |
      | hreflang | blank             |
    Then I should see a selector 'link' in "dest/en/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |
    Then I should see a selector 'link' in "dest/blank/about.html" with the attributes:
      | rel      | alternate      |
      | href     | /en/about.html |
      | hreflang | en             |
    Then I should see a selector 'link' in "dest/blank/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |

    Then I should see a selector 'link' in "dest/en/index.html" with the attributes:
      | rel      | alternate |
      | href     | /blank/   |
      | hreflang | blank     |
    Then I should see a selector 'link' in "dest/en/index.html" with the attributes:
      | rel      | alternate |
      | href     | /nada/    |
      | hreflang | nada      |
    Then I should see a selector 'link' in "dest/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /en/      |
      | hreflang | en        |
    Then I should see a selector 'link' in "dest/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /nada/    |
      | hreflang | nada      |

  Scenario: Rosey adds content-language to meta
    Given I have a "source/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/nada.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'meta' in "dest/en/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | en               |
    Then I should see a selector 'meta' in "dest/blank/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | blank            |
    Then I should see a selector 'meta' in "dest/nada/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | nada             |
