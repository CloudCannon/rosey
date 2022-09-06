Feature: Rosey check v1

	Scenario: Rosey check finds current translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"seal": "Kiss From A Rose"
			}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"seal": "Kiss From A 🐝"
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

	Scenario: Rosey check finds missing translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{
				"seal": "Kiss From A Rose"
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
			| em.states.current  | int:0      |
			| em.states.outdated | int:0      |
			| em.states.missing  | int:1      |
			| em.states.unused   | int:0      |
			| em.keys.seal       | missing    |

	Scenario: Rosey check finds unused translations
		Given I have a "rosey/source.json" file with the content:
			"""
			{}
			"""
		And I have a "rosey/locales/em.json" file with the content:
			"""
			{
				"seal": "Kiss From A 🐢"
			}
			"""
		When I run Rosey check
		Then I should see "rosey/checks.json" containing the values:
			| em.current         | bool:false |
			| em.sourceTotal     | int:0      |
			| em.total           | int:1      |
			| em.states.current  | int:0      |
			| em.states.outdated | int:0      |
			| em.states.missing  | int:0      |
			| em.states.unused   | int:1      |
			| em.keys.seal       | unused     |