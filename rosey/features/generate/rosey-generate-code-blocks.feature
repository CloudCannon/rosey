Feature: Rosey Generate Code Blocks
	Background:
		Given I have the environment variables:
			| ROSEY_SOURCE | dist/site            |
			| ROSEY_DEST   | dist/translated_site |

	Scenario: Rosey generates base.json files with escaped code
		Given I have a "dist/site/index.html" file with the content:
			"""
            <html>
                <body data-rosey-ns='home'>
                    <div data-rosey="seal">Kiss From A Rose</div>
                    <pre><code data-rosey="code">&lt;configuration&gt;&lt;setting v='true'/&gt;&lt;/configuration&gt;</code></pre>
                </body>
            </html>
			"""
		When I run my program with the flags:
			| generate |
		Then I should see "rosey/base.json" containing the values:
			| version                 | int:2                                                                |
			| keys.home:seal.original | Kiss From A Rose                                                     |
			| keys.home:code.original | &lt;configuration&gt;&lt;setting v='true'/&gt;&lt;/configuration&gt; |
