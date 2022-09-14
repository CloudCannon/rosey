Feature: Rosey Build Translated Assets

  Scenario: Rosey build uses translated images
    Given I have a "dist/site/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "dist/site/image.fr.png" file with the content:
      """
      Pretend that I'm a french png
      """
    And I have a "dist/site/image.es.png" file with the content:
      """
      Pretend that I'm a spanish png
      """
    And I have a "dist/site/index.html" file with the content:
      """
      <html>
      <body>
      <img src="/image.png" />
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    And I have a "rosey/locales/es.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'img' in "dist/translated_site/en/index.html" with the attributes:
      | src | /image.png |
    And I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src | /image.fr.png |
    And I should see a selector 'img' in "dist/translated_site/es/index.html" with the attributes:
      | src | /image.es.png |

  Scenario: Rosey build uses translated images from another location
    Given I have a "dist/site/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "dist/site/image.fr.png" file with the content:
      """
      Pretend that I'm a french png
      """
    And I have a "translated/index.html" file with the content:
      """
      <html>
      <body>
      <img src="/image.png" />
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build                        |
      | --source        "translated" |
      | --images-source "dist/site"  |
    Then I should see a selector 'img' in "dist/translated_site/en/index.html" with the attributes:
      | src | /image.png |
    And I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src | /image.fr.png |

  Scenario: Rosey build uses translated srcsets
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
      <img srcset="/image-64w.png 64w,/image-640w.png 640w" src="/image.png">
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'img' in "dist/translated_site/en/index.html" with the attributes:
      | src    | /image.png                              |
      | srcset | /image-64w.png 64w,/image-640w.png 640w |
    Then I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src    | /image.fr.png                                 |
      | srcset | /image-64w.fr.png 64w,/image-640w.fr.png 640w |

  Scenario: Rosey build uses translated videos
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
      <video>
      <source src="/video.mp4" type="video/mp4">
      </video>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'source' in "dist/translated_site/en/index.html" with the attributes:
      | src  | /video.mp4 |
      | type | video/mp4  |
    And I should see a selector 'source' in "dist/translated_site/fr/index.html" with the attributes:
      | src  | /video.fr.mp4 |
      | type | video/mp4     |

  Scenario: Rosey build uses translated audio
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
      <audio src="/pod.wav"></audio>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'audio' in "dist/translated_site/en/index.html" with the attributes:
      | src | /pod.wav |
    And I should see a selector 'audio' in "dist/translated_site/fr/index.html" with the attributes:
      | src | /pod.fr.wav |

  Scenario: Rosey build uses translated downloads
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
      <a href="/rtfm.pdf" download="Manual"></a>
      <a href="/rtfm.pdf"></a>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'a:nth-of-type(1)' in "dist/translated_site/en/index.html" with the attributes:
      | href     | /rtfm.pdf |
      | download | Manual    |
    Then I should see a selector 'a:nth-of-type(1)' in "dist/translated_site/fr/index.html" with the attributes:
      | href     | /rtfm.fr.pdf |
      | download | Manual       |
    # non-download links remain untouched
    Then I should see a selector 'a:nth-of-type(2)' in "dist/translated_site/fr/index.html" with the attributes:
      | href | /rtfm.pdf |

  Scenario: Rosey build uses custom translated assets
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
      <i j="/something.extension" data-rosey-asset-attrs="j"></i>
      </body>
      </html>
      """
    And I have a "rosey/locales/fr.json" file with the content:
      """
      {}
      """
    When I run my program with the flags:
      | build |
    Then I should see a selector 'i' in "dist/translated_site/en/index.html" with the attributes:
      | j                      | /something.extension |
      | data-rosey-asset-attrs | j                    |
    Then I should see a selector 'i' in "dist/translated_site/fr/index.html" with the attributes:
      | j                      | /something.fr.extension |
      | data-rosey-asset-attrs | j                       |
