Feature: Rosey Build Meta

  Scenario: Rosey adds alternates to meta
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "dist/site/about.html" file with the content:
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
    When I run my program with the flags:
      | build |
    Then I should not see a selector 'link' in "dist/translated_site/about.html" with the attributes:
      | rel      | alternate      |
      | href     | /en/about.html |
      | hreflang | en             |
    Then I should see a selector 'link' in "dist/translated_site/about.html" with the attributes:
      | rel      | alternate         |
      | href     | /blank/about.html |
      | hreflang | blank             |
    Then I should see a selector 'link' in "dist/translated_site/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |

    Then I should see a selector 'link' in "dist/translated_site/en/about.html" with the attributes:
      | rel      | alternate         |
      | href     | /blank/about.html |
      | hreflang | blank             |
    Then I should see a selector 'link' in "dist/translated_site/en/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |
    Then I should see a selector 'link' in "dist/translated_site/blank/about.html" with the attributes:
      | rel      | alternate      |
      | href     | /en/about.html |
      | hreflang | en             |
    Then I should see a selector 'link' in "dist/translated_site/blank/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |

    Then I should see a selector 'link' in "dist/translated_site/en/index.html" with the attributes:
      | rel      | alternate |
      | href     | /blank/   |
      | hreflang | blank     |
    Then I should see a selector 'link' in "dist/translated_site/en/index.html" with the attributes:
      | rel      | alternate |
      | href     | /nada/    |
      | hreflang | nada      |
    Then I should see a selector 'link' in "dist/translated_site/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /en/      |
      | hreflang | en        |
    Then I should see a selector 'link' in "dist/translated_site/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /nada/    |
      | hreflang | nada      |

  Scenario: Rosey adds content-language to meta
    Given I have a "dist/site/index.html" file with the content:
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
    When I run my program with the flags:
      | build |
    Then I should see a selector 'meta' in "dist/translated_site/en/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | en               |
    Then I should see a selector 'meta' in "dist/translated_site/blank/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | blank            |
    Then I should see a selector 'meta' in "dist/translated_site/nada/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | nada             |
