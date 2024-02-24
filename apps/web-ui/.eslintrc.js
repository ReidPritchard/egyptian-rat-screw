/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@oers/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
