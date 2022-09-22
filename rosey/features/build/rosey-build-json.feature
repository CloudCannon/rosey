Feature: Rosey Build JSON
  Background:
    Given I have the environment variables:
      | ROSEY_SOURCE | dist/site            |
      | ROSEY_DEST   | dist/translated_site |

  Scenario: Rosey builds JSON
    Given I have a "dist/site/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home Page",
          "title": "Home page title"
        }
      }
      """
    And I have a "dist/site/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey:mushroom.n",
          "title": "rosey:mushroom.t"
        }
      }
      """
    And I have a "rosey/locales/consonants.json" file with the content:
      """
      {
        "mushroom.n": "Hm Pg",
        "mushroom.t": "Hm pg ttl"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see "dist/translated_site/en/titles.json" containing the values:
      | mushroom.name  | Home Page       |
      | mushroom.title | Home page title |
    Then I should see "dist/translated_site/consonants/titles.json" containing the values:
      | mushroom.name  | Hm Pg     |
      | mushroom.title | Hm pg ttl |

  Scenario: Rosey builds JSON with namespaces
    Given I have a "dist/site/titles.json" file with the content:
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
    And I have a "dist/site/titles.rosey.json" file with the content:
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
    And I have a "rosey/locales/consonants.json" file with the content:
      """
      {
        "home.name": "Hm",
        "home.title": "Hm pg ttl",
        "home.sub": "Hll"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see "dist/translated_site/en/titles.json" containing the values:
      | mushroom.name            | Home            |
      | mushroom.title           | Home page title |
      | mushroom.nested.subtitle | Hello :)        |
    Then I should see "dist/translated_site/consonants/titles.json" containing the values:
      | mushroom.name            | Hm        |
      | mushroom.title           | Hm pg ttl |
      | mushroom.nested.subtitle | Hll       |

  Scenario: Rosey builds JSON with multiple namespaces
    Given I have a "dist/site/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home",
          "meow": "Woof",
          "title": "Homepagetitle",
          "hotdog": "Sandwich"
        }
      }
      """
    And I have a "dist/site/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey-ns|rosey:name",
          "meow": "rosey:animal",
          "title": "rosey-ns|rosey:title",
          "hotdog": "rosey:food"
        }
      }
      """
    And I have a "rosey/locales/consonants.json" file with the content:
      """
      {
        "home.name": "Hm",
        "home.animal": "Wf",
        "home.homepagetitle.title": "Hm pg ttl",
        "home.homepagetitle.food": "Sndwch"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see "dist/translated_site/en/titles.json" containing the values:
      | mushroom.name   | Home          |
      | mushroom.meow   | Woof          |
      | mushroom.title  | Homepagetitle |
      | mushroom.hotdog | Sandwich      |
    Then I should see "dist/translated_site/consonants/titles.json" containing the values:
      | mushroom.name   | Hm        |
      | mushroom.meow   | Wf        |
      | mushroom.title  | Hm pg ttl |
      | mushroom.hotdog | Sndwch    |

  Scenario: Rosey builds JSON with array namespaces
    Given I have a "dist/site/titles.json" file with the content:
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
    And I have a "dist/site/titles.rosey.json" file with the content:
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
    And I have a "rosey/locales/consonants.json" file with the content:
      """
      {
        "john.name": "Jhn",
        "john.cool.value": "cl",
        "john.blue.value": "bl",
        "john.round.value": "rnd",
        "mark.name": "Mrk",
        "mark.green.value": "grn",
        "mark.square.value": "sqr",
        "mark.top.value": "tp"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see "dist/translated_site/en/titles.json" containing the values:
      | myCollection.0.name   | John   |
      | myCollection.0.tags.0 | cool   |
      | myCollection.0.tags.1 | blue   |
      | myCollection.0.tags.2 | round  |
      | myCollection.1.name   | Mark   |
      | myCollection.1.tags.0 | green  |
      | myCollection.1.tags.1 | square |
      | myCollection.1.tags.2 | top    |
    Then I should see "dist/translated_site/consonants/titles.json" containing the values:
      | myCollection.0.name   | Jhn |
      | myCollection.0.tags.0 | cl  |
      | myCollection.0.tags.1 | bl  |
      | myCollection.0.tags.2 | rnd |
      | myCollection.1.name   | Mrk |
      | myCollection.1.tags.0 | grn |
      | myCollection.1.tags.1 | sqr |
      | myCollection.1.tags.2 | tp  |

  Scenario: Rosey builds JSON retaining untagged fields
    Given I have a "dist/site/titles.json" file with the content:
      """
      {
        "mushroom": {
          "name": "Home Page",
          "title": "Home page title"
        }
      }
      """
    And I have a "dist/site/titles.rosey.json" file with the content:
      """
      {
        "mushroom": {
          "name": "rosey:mushroom.n"
        }
      }
      """
    And I have a "rosey/locales/consonants.json" file with the content:
      """
      {
        "mushroom.n": "Hm Pg"
      }
      """
    When I run my program with the flags:
      | build |
    Then I should see "dist/translated_site/en/titles.json" containing the values:
      | mushroom.name  | Home Page       |
      | mushroom.title | Home page title |
    Then I should see "dist/translated_site/consonants/titles.json" containing the values:
      | mushroom.name  | Hm Pg           |
      | mushroom.title | Home page title |