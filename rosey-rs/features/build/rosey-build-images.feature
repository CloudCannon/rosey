Feature: Rosey Build Images

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
    When I run Rosey build
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
    When I run Rosey build with options:
      | source        | translated |
      | images-source | dist/site  |
    Then I should see a selector 'img' in "dist/translated_site/en/index.html" with the attributes:
      | src | /image.png |
    And I should see a selector 'img' in "dist/translated_site/fr/index.html" with the attributes:
      | src | /image.fr.png |
