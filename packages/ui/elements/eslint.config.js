// import js from '@eslint/js';
// import tsPlugin from '@typescript-eslint/eslint-plugin';
// import tsParser from '@typescript-eslint/parser';
// import prettierConfig from 'eslint-config-prettier';
// import importPlugin from 'eslint-plugin-import';
import litPlugin from 'eslint-plugin-lit';
// import prettierPlugin from 'eslint-plugin-prettier';
// import globals from 'globals';
import globalConfig from '../../../eslint.config.js';

// can effect roll up process, needs to align with rollup and tsconfig
export default [
  globalConfig,
  {
    // add lit plugin for component files
    files: ['components/*.ts'],
    plugins: { lit: litPlugin }, // import: importPlugin
    rules: { ...litPlugin.configs.recommended.rules },
    settings: { lit: { mode: 'typescript' } },
  },
  // {
  //   // Stories
  //   files: ['components/*.ts'],
  //   plugins: { '@typescript-eslint': tsPlugin },
  // },
  // js.configs.recommended,
  // // {
  // //   // Scripts and config files
  // //   files: ['**/*.js'],
  // //   ignores: ['dist/**/*'],
  // //   languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  // //   plugins: { prettier: prettierPlugin },
  // //   rules: { ...prettierPlugin.configs.recommended.rules, 'prettier/prettier': ['error', { endOfLine: 'auto' }] },
  // // },
  // {
  //   // Typescript files
  //   // files: ['**/*.ts', '**/*.tsx'],
  //   files: ['components/*.ts'],
  //   ignores: ['dist/**/*'],
  //   languageOptions: {
  //     parser: tsParser,
  //     parserOptions: { project: './tsconfig.json', ecmaVersion: 'latest', sourceType: 'module' },
  //   },
  //   plugins: { '@typescript-eslint': tsPlugin, lit: litPlugin, import: importPlugin, prettier: prettierPlugin },
  //   rules: {
  //     ...tsPlugin.configs.recommended.rules,
  //     ...litPlugin.configs.recommended.rules,
  //     ...prettierPlugin.configs.recommended.rules,
  //     // ...tsPlugin.configs.recommended.rules,
  //     // ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
  //     // ...litPlugin.configs.recommended.rules,
  //     // ...prettierPlugin.configs.recommended.rules,
  //     // '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
  //   },
  //   settings: { lit: { mode: 'typescript' } },
  // },
  // prettierConfig,
];
