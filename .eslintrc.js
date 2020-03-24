module.exports = { 
  "extends": ["airbnb-base","plugin:mocha/recommended"],
  "env": {
    "mocha": true
  },
  "rules": {
    "mocha/no-exclusive-tests": "error",
    "mocha/no-identical-title": "error",
    "mocha/no-mocha-arrows": "off",
    "mocha/no-nested-tests": "error",
    "mocha/no-pending-tests": "error",
    "mocha/no-return-and-callback": "error",
    "mocha/no-sibling-hooks": "error",
    "mocha/no-skipped-tests": "error",
    "mocha/no-synchronous-tests": "error",
    "mocha/no-top-level-hooks": "error",
    "mocha/handle-done-callback": "error",
    "no-unused-vars": [
      "error",
      { "varsIgnorePattern": "should|expect" }
    ],
    "no-param-reassign":"off",
  }
};