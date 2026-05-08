// templates/.eslintrc.cjs
// Copy this file to the root of each sub-project (agri-bot/, krishi-record/, etc.)
// Run: cp templates/.eslintrc.cjs ./.eslintrc.cjs

'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: [
    'eslint:recommended',
    'prettier', // must be last — disables formatting rules
  ],
  plugins: [],
  rules: {
    // ── Security ──────────────────────────────────────────────────────────
    'no-eval':               'error',
    'no-implied-eval':       'error',
    'no-new-func':           'error',
    'no-script-url':         'error',

    // ── Logging ───────────────────────────────────────────────────────────
    // console.log is blocked in production code — use Winston or loglevel
    'no-console':            ['error', { allow: ['warn', 'error'] }],

    // ── Code Quality ──────────────────────────────────────────────────────
    'no-unused-vars':        ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-var':                'error',
    'prefer-const':          'error',
    'eqeqeq':               ['error', 'always'],
    'no-throw-literal':      'error',
    'no-return-await':       'warn',

    // ── Module System ─────────────────────────────────────────────────────
    // Enforce ESM — no require() in production Node.js code
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='require']",
        message: 'Use ESM import instead of require(). This project uses Node.js ESM.',
      },
    ],
  },
  overrides: [
    // Test files — allow console and relax some rules
    {
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: { node: true },
      rules: {
        'no-console': 'off',
      },
    },
    // React/JSX files
    {
      files: ['**/*.jsx', '**/*.tsx'],
      env: { browser: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'logs/',
    '.session/',
    'chroma_db/',
    '*.min.js',
  ],
};
