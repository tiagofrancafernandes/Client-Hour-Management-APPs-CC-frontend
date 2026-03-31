// eslint.config.js
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
    // Base recommended rules (JavaScript)
    js.configs.recommended,

    // Vue recommended rules (flat config)
    ...vue.configs["flat/recommended"],

    // Project-specific configuration
    {
        files: ["**/*.vue", "**/*.js", "**/*.ts"],

        languageOptions: {
            // Use Vue parser to properly handle .vue files
            parser: vueParser,

            parserOptions: {
                // Use TypeScript parser inside <script> blocks
                parser: tsParser,
                ecmaVersion: "latest",
                sourceType: "module",
            },

            // Define browser globals (window, localStorage, etc.)
            globals: globals.browser,
        },

        rules: {
            "no-useless-escape": "off",

            /**
             * DISABLE NOISY / CONFLICTING RULES
             */

            "vue/v-slot-style": "off",
            "vue/attributes-order": "off",
            "vue/attribute-hyphenation": "off",

            // Disable undefined variable errors (handled by environment)
            "no-undef": "off",

            // Disable unused variables rule
            "no-unused-vars": "off",
            /*
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            /**/

            // Vue template formatting rules (delegated to Prettier)
            "vue/html-indent": "off",
            "vue/max-attributes-per-line": "off",
            "vue/singleline-html-element-content-newline": "off",

            /**
             * BASIC CODE STYLE RULES
             */

            // Enforce semicolons
            semi: ["error", "always"],

            // Enforce 4-space indentation
            indent: ["error", 4],
        },
    },

    /**
     * PRETTIER INTEGRATION (must be last)
     * Disables ESLint rules that conflict with Prettier
     */
    prettier,
];
