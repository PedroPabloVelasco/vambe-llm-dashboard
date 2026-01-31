import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-duplicates': 'error',
      'import/order': ['error', { 'newlines-between': 'always' }],
    },
  },
];
