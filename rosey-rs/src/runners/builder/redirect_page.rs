pub static DEFAULT: &str = r#"
<!DOCTYPE html>
<html lang="DEFAULT_LANGUAGE">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        
        <title>Redirecting...</title>
        <meta http-equiv="content-language" content="DEFAULT_LANGUAGE">
        
        <link rel="canonical" href="/DEFAULT_LANGUAGESITE_PATH" hreflang="DEFAULT_LANGUAGE"/>
        ALTERNATES

        <meta http-equiv="refresh" content="1;url=/DEFAULT_LANGUAGESITE_PATH">

        <style>
            html,
            body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background-color: #F5F4F8;
                font-family: Helvetica, Arial;
            }

            body {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        </style>
    </head>
    <body>
        <div>
            <h1>Redirecting…</h1>
            <p><a href="/DEFAULT_LANGUAGESITE_PATH">Click here if you are not redirected.</a></p>
        </div>
        <script>
            (function () {
                var defaultLocale = "DEFAULT_LANGUAGE";
                var supportedLocales = LOCALE_LOOKUP;
                
                var language;

                try {
                    function getBrowserLanguages() {
                        if (navigator.languages && navigator.languages.length > 0) {
                            return navigator.languages;
                        }

                        var language = navigator.language || navigator.userLanguage || defaultLocale;

                        return [language];
                    }

                    function getBestLanguage() {
                        var storedLocale = localStorage.getItem("force-language") || localStorage.getItem("eu-cc");
                        if (storedLocale) {
                            return storedLocale;
                        }

                        var languages = getBrowserLanguages();
                        for (var i = 0; i < languages.length; i++) {
                            var match = languages[0].toLowerCase().match(/[a-z]+/gi),
                                language = match[0], country = match[1];

                            if (supportedLocales[language + "-" + country]) {
                                return supportedLocales[language + "-" + country];
                            }

                            if (supportedLocales[language]) {
                                return supportedLocales[language];
                            }
                        }

                        return defaultLocale;
                    }

                    language = getBestLanguage();
                } catch (e) {
                    console.error(e);
                    language = defaultLocale;
                }

                var redirectPath;
                var linkElements = document.getElementsByTagName("link");
                for (var i = 0; i < linkElements.length; i++) {
                    if (linkElements[i].getAttribute("rel") === "canonical") {
                        redirectPath = linkElements[i].getAttribute("href")
                    }

                    if (linkElements[i].getAttribute("hreflang") === language) {
                        redirectPath = linkElements[i].getAttribute("href");
                        break;
                    }
                }

                // Use meta refresh for default path
                if (!redirectPath) { 
                    return;
                }

                var url = location.protocol + "//" + location.host + redirectPath;
                var search = location.search || '';

                var referrer = document.referrer;
                if (referrer && search.indexOf("utm_referrer") < 0) {
                    search += "&utm_referrer=" + referrer;
                }

                search = search.replace(/^&/, "?");

                var hash = location.hash || '';

                location.replace(url + search + hash);
            })();
        </script>
    </body>
</html>
"#;
