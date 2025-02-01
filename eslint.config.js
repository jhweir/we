import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    // todo: test - should apply to js & ts configs below...
    name: "common/recommended",
    plugins: { prettier: prettierPlugin },
    rules: { ...prettierPlugin.configs.recommended.rules },
    ignores: ["**/dist/**", "**/node_modules/**", "**/build/**"],
  },
  {
    name: "javascript/recommended",
    files: ["**/*.js", "**/*.jsx"],
    rules: { ...js.configs.recommended.rules },
  },
  {
    name: "typescript/recommended",
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } },
    rules: { ...tsPlugin.configs.recommended.rules },
  },
  // turn off any rules that conflict with prettier
  eslintConfigPrettier
];
