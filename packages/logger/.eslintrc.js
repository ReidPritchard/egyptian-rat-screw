import { parser } from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.Config} */

const config = {
  extends: ['@oers/eslint-config/index.js'],
  parser,
  parserOptions: {
    project: true,
  },
  env: {
    jest: true,
  },
};

export default config;
