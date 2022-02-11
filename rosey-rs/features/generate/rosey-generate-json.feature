Feature: Rosey Generate JSON

  Scenario: Rosey generates source.json files from JSON
    Given I have a "source/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home Page",
          "title": "Home page title"
        }
      }
      """
    And I have a "source/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey:mushroom.name",
          "title": "rosey:mushroom.title"
        }
      }
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                       | int:2           |
      | keys.mushroom\.name.original  | Home Page       |
      | keys.mushroom\.title.original | Home page title |

  Scenario: Rosey includes JSON translation counts
    Given I have a "source/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home Page",
          "title": "Home page title"
        }
      }
      """
    And I have a "source/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey:mushroom.name",
          "title": "rosey:mushroom.title"
        }
      }
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                                 | int:2 |
      | keys.mushroom\.name.pages.titles\.json  | int:1 |
      | keys.mushroom\.title.pages.titles\.json | int:1 |

  Scenario: Rosey generates v1 source.json files from JSON
    Given I have a "source/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home Page",
          "title": "Home page title"
        }
      }
      """
    And I have a "source/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey:mushroom.name",
          "title": "rosey:mushroom.title"
        }
      }
      """
    When I run Rosey generate with options:
      | version | 1 |
    Then I should see "rosey/source.json" containing the values:
      | mushroom\.name  | Home Page       |
      | mushroom\.title | Home page title |

  Scenario: Rosey generates source.json files from JSON with namespaces
    Given I have a "source/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home",
          "title": "Home page title",
          "nested": {
            "subtitle": "Hello :)"
          }
        }
      }
      """
    And I have a "source/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey-ns|rosey:name",
          "title": "rosey:title",
          "nested": {
            "subtitle": "rosey:sub"
          }
        }
      }
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                   | int:2           |
      | keys.home\.name.original  | Home            |
      | keys.home\.title.original | Home page title |
      | keys.home\.sub.original   | Hello :)        |

  Scenario: Rosey generates source.json files from JSON with array namespaces
    Given I have a "source/titles.json" file with the content:
      """
      {
        "myCollection": [
          {
            "name": "John",
            "tags": [
              "cool",
              "blue",
              "round"
            ]
          },
          {
            "name": "Mark",
            "tags": [
              "green",
              "square",
              "top"
            ]
          }
        ]
      }
      """
    And I have a "source/titles.rosey.json" file with the content:
      """
      {
        "myCollection": [
          {
            "name": "rosey-ns|rosey:name",
            "tags": [
              "rosey-array-ns|rosey:value"
            ]
          }
        ]
      }
      """
    When I run Rosey generate
    Then I should see "rosey/source.json" containing the values:
      | version                           | int:2  |
      | keys.john\.name.original          | John   |
      | keys.john\.cool\.value.original   | cool   |
      | keys.john\.blue\.value.original   | blue   |
      | keys.john\.round\.value.original  | round  |
      | keys.mark\.name.original          | Mark   |
      | keys.mark\.green\.value.original  | green  |
      | keys.mark\.square\.value.original | square |
      | keys.mark\.top\.value.original    | top    |
