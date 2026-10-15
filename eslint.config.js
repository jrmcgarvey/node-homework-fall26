const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");
const jestPlugin = require("eslint-plugin-jest");

module.exports = defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs", globals: { ...globals.node} },
    rules: {
      "no-unused-vars": [
        "error",
        {
          "varsIgnorePattern": "^_$", 
          // "all" forces ESLint to check all parameters (even if they are before a used parameter)
          "args": "all",
          // Regex to bypass linting for 'next' or variables prefixed with an underscore
          "argsIgnorePattern": "^(next|_.*)$" 
        }
      ]
    }
  },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.test.js", "**/*.spec.js", "**/__tests__/**/*.js"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest, // Explicitly registers expect, test, describe, etc.
      },
    },
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
    },
  }, 
  { ignores: [
    "tdd/**",
    "lesson9TDD"
  ]}
]);