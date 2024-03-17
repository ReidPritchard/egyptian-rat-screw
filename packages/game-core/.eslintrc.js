/** @type {import("eslint").Linter.Config} */
const config = {
  extends: ['@oers/eslint-config/index.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  env: {
    jest: true,
  },
};

export default config;
