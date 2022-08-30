Feature: Rosey check v2

	Scenario: Rosey check finds current translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"version": 2,
				"keys": {
					"seal": {
						"original": "Kiss From A Rose"
					}
				}
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"seal": {
					"original": "Kiss From A Rose"
				}
			}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current         | bool:true |
			| em.sourceTotal     | int:1     |
			| em.total           | int:1     |
			| em.states.current  | int:1     |
			| em.states.outdated | int:0     |
			| em.states.missing  | int:0     |
			| em.states.unused   | int:0     |
			| em.keys.seal       | current   |

	Scenario: Rosey check finds outdated translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"version": 2,
				"keys": {
					"seal": {
						"original": "Kiss From A Rose"
					}
				}
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"seal": {
					"original": "Kiss Fromage Rose"
				}
			}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current         | bool:false |
			| em.sourceTotal     | int:1      |
			| em.total           | int:1      |
			| em.states.outdated | int:1      |
			| em.states.current  | int:0      |
			| em.states.missing  | int:0      |
			| em.states.unused   | int:0      |
			| em.keys.seal       | outdated   |

	Scenario: Rosey check finds missing translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"version": 2,
				"keys": {
					"seal": {
						"original": "Kiss From A Rose"
					}
				}
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current         | bool:false |
			| em.sourceTotal     | int:1      |
			| em.total           | int:0      |
			| em.states.outdated | int:0      |
			| em.states.current  | int:0      |
			| em.states.missing  | int:1      |
			| em.states.unused   | int:0      |
			| em.keys.seal       | missing    |

	Scenario: Rosey check finds unused translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"version": 2,
				"keys": {}
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"spheal": {
					"value": "🐟"
				}
			}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current         | bool:false |
			| em.sourceTotal     | int:0      |
			| em.total           | int:1      |
			| em.states.outdated | int:0      |
			| em.states.current  | int:0      |
			| em.states.missing  | int:0      |
			| em.states.unused   | int:1      |
			| em.keys.spheal     | unused     |

	Scenario: Rosey check counts total translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"version": 2,
				"keys": {
					"1": {
						"value": "1"
					},
					"2": {
						"value": "2"
					},
					"3": {
						"value": "3"
					},
					"4": {
						"value": "4"
					}
				}
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"1": {
					"value": "1"
				},
				"2": {
					"value": "2"
				}
			}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current     | bool:false |
			| em.sourceTotal | int:4      |
			| em.total       | int:2      |