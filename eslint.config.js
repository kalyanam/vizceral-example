import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, __HIDE_DATA__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node }
  },
  {
    // Vendored from Netflix/vizceral; keep the diff against upstream small.
    files: ['src/lib/vizceral/**/*.js'],
    rules: {
      'no-empty': 'off',
      'no-useless-assignment': 'off',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }]
    }
  },
  {
    files: ['src/lib/vizceral/layouts/ltrTreeLayout/ltrTreeLayoutWorker.js'],
    languageOptions: { globals: globals.worker }
  }
];
