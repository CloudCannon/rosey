Feature: Rosey Build Redirect

  Scenario: Rosey builds a redirect page for each file
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      </html>
      """
    Given I have a "dist/site/about.html" file with the content:
      """
      <html>
      </html>
      """
    Given I have a "dist/site/contact/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'a' in "dist/translated_site/index.html" with the attributes:
      | href      | /en/                                  |
      | innerText | Click here if you are not redirected. |
    Then I should see a selector 'a' in "dist/translated_site/about.html" with the attributes:
      | href      | /en/about.html                        |
      | innerText | Click here if you are not redirected. |
    Then I should see a selector 'a' in "dist/translated_site/contact/index.html" with the attributes:
      | href      | /en/contact/                          |
      | innerText | Click here if you are not redirected. |

  Scenario: Rosey adds default canonicals to redirect pages
    Given I have a "dist/site/about.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build
    Then I should see a selector 'link' in "dist/translated_site/about.html" with the attributes:
      | rel      | canonical      |
      | href     | /en/about.html |
      | hreflang | en             |

  Scenario: Rosey adds configured canonicals to redirect pages
    Given I have a "dist/site/about.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | default-language | blank |
    Then I should see a selector 'link' in "dist/translated_site/about.html" with the attributes:
      | rel      | canonical         |
      | href     | /blank/about.html |
      | hreflang | blank             |

  Scenario: Rosey adds meta redirect to redirect pages
    Given I have a "dist/site/about.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | default-language | blank |
    Then I should see a selector 'meta' in "dist/translated_site/about.html" with the attributes:
      | http-equiv | refresh                 |
      | content    | 1;url=/blank/about.html |

  Scenario: Rosey build uses custom redirect page
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "helpers/redirect.html" file with the content:
      """
      <html>
      <body>
      <h1>REDIRECT!!!</h1>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | redirect-page | helpers/redirect.html |
    Then I should see a selector 'h1' in "dist/translated_site/index.html" with the attributes:
      | innerText | REDIRECT!!! |

  Scenario: Rosey build injects tags into custom redirect page
    Given I have a "dist/site/test.html" file with the content:
      """
      <html>
      </html>
      """
    And I have a "helpers/redirect.html" file with the content:
      """
      <html>
      <head>
      <link rel="canonical" href="/DEFAULT_LANGUAGESITE_PATH" hreflang="DEFAULT_LANGUAGE"/>
      <meta http-equiv="content-language" content="DEFAULT_LANGUAGE">
      ALTERNATES
      </head>
      <body>
      <h1>REDIRECT!!!</h1>
      <code>LOCALE_LOOKUP</code>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank-nada.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/en.json" file with the content:
      """
      {}
      """
    When I run Rosey build with options:
      | redirect-page    | helpers/redirect.html |
      | default-language | blank-nada            |
    Then I should see a selector 'link' in "dist/translated_site/test.html" with the attributes:
      | rel      | canonical             |
      | href     | /blank-nada/test.html |
      | hreflang | blank-nada            |
    Then I should see a selector 'meta' in "dist/translated_site/test.html" with the attributes:
      | http-equiv | content-language |
      | content    | blank-nada       |
    Then I should see a selector 'link' in "dist/translated_site/test.html" with the attributes:
      | rel      | alternate     |
      | href     | /en/test.html |
      | hreflang | en            |
    Then I should see a selector 'code' in "dist/translated_site/test.html" with the attributes:
      | innerText | {"blank":"blank-nada","blank-nada":"blank-nada","blank_nada":"blank-nada","en":"en"} |
