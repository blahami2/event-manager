import { defineConfig } from "eslint/config";
import eslintPlugin from "@eslint/js";
import { configs as tseslintConfigs } from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

/**
 * ESLint flat config for birthday-celebration.
 *
 * Translates the rules from docs/VERIFICATION_RULES.md Section 2
 * (originally specified as .eslintrc.json) into ESLint 9 flat config format.
 *
 * Required rules enforced:
 * - @typescript-eslint/no-explicit-any: error
 * - @typescript-eslint/no-unused-vars: error
 * - @typescript-eslint/explicit-function-return-type: warn (with allowExpressions)
 * - no-console: error (allow warn, error)
 * - no-restricted-imports: PrismaClient only in src/repositories/
 *
 * Overrides:
 * - src/repositories/**\/*.ts: no-restricted-imports off
 * - src/lib/logger.ts: no-console off
 */

// Global ignores
const ignoresConfig = defineConfig([
  {
    name: "project/ignores",
    ignores: [
      ".next/",
      "node_modules/",
      "public/",
      ".vscode/",
      "next-env.d.ts",
      "coverage/",
      "next.config.js",
      "postcss.config.mjs",
    ],
  },
]);

// ESLint recommended rules
const eslintConfig = defineConfig([
  {
    name: "project/javascript-recommended",
    files: ["**/*.{js,mjs,ts,tsx}"],
    ...eslintPlugin.configs.recommended,
  },
]);

// TypeScript configuration
const typescriptConfig = defineConfig([
  {
    name: "project/typescript-strict",
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslintConfigs.strict],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Required by VERIFICATION_RULES
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
    },
  },
  {
    name: "project/javascript-disable-type-check",
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslintConfigs.disableTypeChecked,
  },
]);

// React and Next.js configuration
const reactConfig = defineConfig([
  {
    name: "project/react-next",
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooksPlugin.configs["recommended-latest"].rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);

// Project-specific rules (from VERIFICATION_RULES Section 2)
const projectRulesConfig = defineConfig([
  {
    name: "project/custom-rules",
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              importNames: ["PrismaClient"],
              message:
                "Import PrismaClient only in src/repositories/. Use repository methods elsewhere.",
            },
          ],
        },
      ],
    },
  },
  // Override: Allow PrismaClient imports in repositories and seed script
  {
    name: "project/repositories-override",
    files: ["src/repositories/**/*.ts", "prisma/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override: Allow console in logger
  {
    name: "project/logger-override",
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default defineConfig([
  ...ignoresConfig,
  ...eslintConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...projectRulesConfig,
]);
