Feature: Rosey Build Complex

  Scenario: Rosey build includes whitespace
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">
      Kiss From A Rose
      </p>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      {
        "seal": "\n  \n  Kiss  From  A  Rose\n"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal                 |
      | innerText  | \nKiss From A Rose\n |
    And I should see a selector 'p' in "dist/translated_site/airy/index.html" with the attributes:
      | data-rosey | seal                          |
      | innerText  | \n  \n  Kiss  From  A  Rose\n |

  Scenario: Rosey build includes HTML
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/airy.json" file with the content:
      """
      {
        "seal": "<p>Kiss From A <span class='rose'>Rose</span></p>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div > p' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'div > p > span' in "dist/translated_site/airy/index.html" with the attributes:
      | class     | rose |
      | innerText | Rose |

  Scenario: Rosey build includes utf8
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="seal">🦭</p>
      <p data-rosey="e">𓀞𓂗𓃛𓄫𓋟</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/hmm.json" file with the content:
      """
      {
        "e": "𓆔𓆫𓆿",
        "seal": "c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | seal |
      | innerText  | 🦭   |
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | e          |
      | innerText  | 𓀞𓂗𓃛𓄫𓋟 |
    And I should see a selector 'p' in "dist/translated_site/hmm/index.html" with the attributes:
      | data-rosey | seal                   |
      | innerText  | c̬̟h͡a̫̻̯͘o̫̟̖͍̙̝͉s̗̦̲ |
    And I should see a selector 'p' in "dist/translated_site/hmm/index.html" with the attributes:
      | data-rosey | e      |
      | innerText  | 𓆔𓆫𓆿 |

  Scenario: Rosey build includes utf8 keys
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <p data-rosey="🦭">seal</p>
      <p data-rosey="אֱלֹהִים">e</p>
      </body>
      </html>
      """
    And I have a "rosey/locales/rtl.json" file with the content:
      """
      {
        "אֱלֹהִים": "١٢٣",
        "🦭": "بين ما, يذكر"
      }
      """
    # 👆 This whole line is RTL, it's likely rendering as
    # { "value" :"key" ,"value" :"key" }
    When I run my program with the flags:
      | build |
    Then I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | 🦭   |
      | innerText  | seal |
    And I should see a selector 'p' in "dist/translated_site/en/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText  | e        |
    And I should see a selector 'p' in "dist/translated_site/rtl/index.html" with the attributes:
      | data-rosey | 🦭           |
      | innerText  | بين ما, يذكر |
    And I should see a selector 'p' in "dist/translated_site/rtl/index.html" with the attributes:
      | data-rosey | אֱלֹהִים |
      | innerText  | ١٢٣      |

  Scenario: Rosey build handles missing translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal">Kiss From A Rose</div>
      </body>
      </html>
      """
    And I have a "rosey/locales/ohno.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div' in "dist/translated_site/ohno/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    But I should not see a selector 'div>div' in "dist/translated_site/ohno/index.html"

  Scenario: Rosey build handles missing HTML translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><div>Kiss From A Rose</div></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/ohno.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div' in "dist/translated_site/ohno/index.html" with the attributes:
      | data-rosey | seal             |
      | innerText  | Kiss From A Rose |
    And I should see a selector 'div>div' in "dist/translated_site/ohno/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    But I should not see a selector 'div>div>div' in "dist/translated_site/ohno/index.html"
    And I should not see a selector 'div>div>div:nth-of-type(2)' in "dist/translated_site/ohno/index.html"

  Scenario: Rosey build translates images inside HTML translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/jp.json" file with the content:
      """
      {
        "seal": "これは絵です <img src=\"/image.png\"/>"
      }
      """
    And I have a "dist/site/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "dist/site/image.jp.png" file with the content:
      """
      私は絵です
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div > p' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'img' in "dist/translated_site/jp/index.html" with the attributes:
      | src | /image.jp.png |
    But I should not see a selector 'img' in "dist/translated_site/en/index.html"

  Scenario: Rosey build translates links inside HTML translations
    Given I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="seal"><p>Kiss From A Rose</p></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/jp.json" file with the content:
      """
      {
        "seal": "これはリンクです <a href=\"/other.html\"/>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'div > p' in "dist/translated_site/en/index.html" with the attributes:
      | innerText | Kiss From A Rose |
    And I should see a selector 'a' in "dist/translated_site/jp/index.html" with the attributes:
      | href | /jp/other.html |
    But I should not see a selector 'img' in "dist/translated_site/en/index.html"

  Scenario: Rosey build uses translated srcsets inside HTML translations
    Given I have a "dist/site/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "dist/site/image-64w.png" file with the content:
      """
      Pretend that I'm a small png
      """
    And I have a "dist/site/image-640w.png" file with the content:
      """
      Pretend that I'm a medium png
      """
    And I have a "dist/site/image.fr.png" file with the content:
      """
      Pretend that I'm a french png
      """
    And I have a "dist/site/image-64w.fr.png" file with the content:
      """
      Pretend that I'm a small french png
      """
    And I have a "dist/site/image-640w.fr.png" file with the content:
      """
      Pretend that I'm a medium french png
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="meow"></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "meow": "<img srcset=\"/image-64w.png 64w,/image-640w.png 640w\" src=\"/image.png\">"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src    | /image.fr.png                                 |
      | srcset | /image-64w.fr.png 64w,/image-640w.fr.png 640w |

  Scenario: Rosey build uses translated videos inside HTML translations
    Given I have a "dist/site/video.mp4" file with the content:
      """
      Pretend that I'm a video
      """
    And I have a "dist/site/video.fr.mp4" file with the content:
      """
      Pretend that I'm a french video
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <video data-rosey="video">
      </video>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "video": "<source src=\"/video.mp4\" type=\"video/mp4\">"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'source' in "dist/translated_site/fr/index.html" with the attributes:
      | src  | /video.fr.mp4 |
      | type | video/mp4     |

  Scenario: Rosey build uses translated audio inside HTML translations
    Given I have a "dist/site/pod.wav" file with the content:
      """
      Pretend that I'm a podcast
      """
    And I have a "dist/site/pod.fr.wav" file with the content:
      """
      Pretend that I'm a french podcast
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="audio"></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "audio": "<audio src=\"/pod.wav\"></audio>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'audio' in "dist/translated_site/fr/index.html" with the attributes:
      | src | /pod.fr.wav |

  Scenario: Rosey build uses translated downloads inside HTML translations
    Given I have a "dist/site/rtfm.pdf" file with the content:
      """
      Pretend that I'm a manual
      """
    And I have a "dist/site/rtfm.fr.pdf" file with the content:
      """
      Pretend that I'm a french manual
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="download"></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "download": "<a href=\"/rtfm.pdf\" download=\"Manual\"></a><a href=\"/rtfm.pdf\"/></a>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'a:nth-of-type(1)' in "dist/translated_site/fr/index.html" with the attributes:
      | href     | /rtfm.fr.pdf |
      | download | Manual       |
    # non-download links remain untouched
    Then I should see a selector 'a:nth-of-type(2)' in "dist/translated_site/fr/index.html" with the attributes:
      | href | /rtfm.pdf |

  Scenario: Rosey build uses custom translated assets inside HTML translations
    Given I have a "dist/site/something.extension" file with the content:
      """
      Pretend that I'm something
      """
    And I have a "dist/site/something.fr.extension" file with the content:
      """
      Pretend that I'm a french something
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <div data-rosey="something"></div>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {
        "something": "<i j=\"/something.extension\" data-rosey-asset-attrs=\"j\"></i>"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'i' in "dist/translated_site/fr/index.html" with the attributes:
      | j                      | /something.fr.extension |
      | data-rosey-asset-attrs | j                       |
