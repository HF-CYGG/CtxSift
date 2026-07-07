import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "tests/fixtures/**",
      "large-project-test/**",
      "vitest-config-no-ts.mjs",
      "tmp-vitest-no-ts.cjs",
      "tmp-vitest.config.js",
      "tmp-npm-cache/**",
      "tmp-vitest-commonjs.config.cjs",
      "tmp-esbuild.exe",
      "tmp-*.js",
      "tmp-*.mjs",
      "tmp-*.cjs",
      "_tmp_*",
      ".tmp-vitest.config.js",
      ".tmp-vitest-no-ts.cjs"
    ]
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly"
      }
    }
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
);
