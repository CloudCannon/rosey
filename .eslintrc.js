module.exports = { 
  "extends": ["airbnb-base","plugin:mocha/recommended"],
  "env": {
    "mocha": true
  },
  "rules": {
    "mocha/no-exclusive-tests": "warn",
    "mocha/no-identical-title": "warn",
    "mocha/no-mocha-arrows": "off",
    "mocha/no-nested-tests": "warn",
    "mocha/no-pending-tests": "warn",
    "mocha/no-return-and-callback": "warn",
    "mocha/no-sibling-hooks": "warn",
    "mocha/no-skipped-tests": "warn",
    "mocha/no-synchronous-tests": "warn",
    "mocha/no-top-level-hooks": "warn",
    "mocha/handle-done-callback": "warn",
    "no-unused-vars": [
      "error",
      { "varsIgnorePattern": "should|expect" }
    ],
    "no-param-reassign":"off",
  }
};