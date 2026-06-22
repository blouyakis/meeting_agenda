import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["backend/**/*.{js,mjs,cjs}"],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
      ...prettier.rules,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    files: ["frontend/**/*.{js,mjs,cjs}"],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
      ...prettier.rules,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
  },
]);
