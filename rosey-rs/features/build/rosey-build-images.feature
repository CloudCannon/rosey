Feature: Rosey Build Images

  Scenario: Rosey build uses translated images
    Given I have a "source/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "source/image.fr.png" file with the content:
      """
      Pretend that I'm a french png
      """
    And I have a "source/index.html" file with the content:
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
    When I run Rosey build
    Then I should see a selector 'img' in "dest/en/index.html" with the attributes:
      | src | /image.png |
    And I should see a selector 'img' in "dest/fr/index.html" with the attributes:
      | src | /image.fr.png |

  Scenario: Rosey build uses translated images from another location
    Given I have a "source/image.png" file with the content:
      """
      Pretend that I'm a png
      """
    And I have a "source/translated_images/image.fr.png" file with the content:
      """
      Pretend that I'm a french png
      """
    And I have a "source/index.html" file with the content:
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
      | images-source | source/translated_images |
    Then I should see a selector 'img' in "dest/en/index.html" with the attributes:
      | src | /image.png |
    And I should see a selector 'img' in "dest/fr/index.html" with the attributes:
      | src | /translated_images/image.fr.png |
