import eslintConfigPrettier from 'eslint-config-prettier';
import turbo from 'eslint-plugin-turbo';
import unicornRules from './rules/unicorn.js';
import bestPracticesRules from './rules/best-pratices.js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compact = new FlatCompat({
  baseDirectory: process.cwd(),
  resolvePluginsRelativeTo: process.cwd(),
});

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  bestPracticesRules,
  unicornRules,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      turbo,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'error',
    },
  },
  {
    ignores: ['dist/**'],
  },
];
