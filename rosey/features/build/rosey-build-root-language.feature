Feature: Rosey Build Using Root Language URLs
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey can build the default language to the root URLs
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="p">english sentence</p>
      </body>
      </html>
      """
    And I have a "dist/site/about.html" file with the content:
      """
      <html>
      <body>
      <h1><a href="/posts/hello-world">Hello World</a></h1>
      </body>
      </html>
      """
    And I have a "rosey/locales/blank.json" file with the content:
      """
      {
        "p": "------- --------"
      }
      """
    And I have a "rosey/locales/nada.json" file with the content:
      """
      {
        "p": "de nada"
      }
      """
    When I run my program with the flags:
      | build |
      | --default-language-at-root |

    Then I should not see the file "dist/translated_site/en/index.html"
    Then I should not see the file "dist/translated_site/en/about.html"

    And I should see a selector 'p' in "dist/translated_site/index.html" with the attributes:
      | data-rosey | p             |
      | innerText  | english sentence |
    And I should see a selector 'p' in "dist/translated_site/nada/index.html" with the attributes:
      | data-rosey | p |
      | innerText  | de nada |

    Then I should see a selector 'h1>a' in "dist/translated_site/about.html" with the attributes:
      | href      | /posts/hello-world |
      | innerText | Hello World              |

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

    Then I should see a selector 'link' in "dist/translated_site/blank/about.html" with the attributes:
      | rel      | alternate      |
      | href     | /about.html |
      | hreflang | en             |
    Then I should see a selector 'link' in "dist/translated_site/blank/about.html" with the attributes:
      | rel      | alternate        |
      | href     | /nada/about.html |
      | hreflang | nada             |

    Then I should see a selector 'link' in "dist/translated_site/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /      |
      | hreflang | en        |
    Then I should see a selector 'link' in "dist/translated_site/blank/index.html" with the attributes:
      | rel      | alternate |
      | href     | /nada/    |
      | hreflang | nada      |

    Then I should see a selector 'meta' in "dist/translated_site/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | en               |
    Then I should see a selector 'meta' in "dist/translated_site/blank/index.html" with the attributes:
      | http-equiv | content-language |
      | content    | blank            |
