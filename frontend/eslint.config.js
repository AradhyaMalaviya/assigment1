import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default [
  {
    ignores: ['.svelte-kit/', 'build/', 'node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    files: ['**/*.{js,ts,svelte}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
