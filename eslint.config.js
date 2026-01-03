const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.jest
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-console": "warn",
            "no-undef": "error",
            "complexity": ["warn", 15]
        },
        ignores: ["web-dashboard/**", "node_modules/**"]
    }
];
