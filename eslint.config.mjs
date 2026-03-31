import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: "readonly",
                window: "readonly",
                document: "readonly",
                fetch: "readonly",
                Promise: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                localStorage: "readonly",
                FormData: "readonly",
                FileReader: "readonly",
                URL: "readonly",
                atob: "readonly",
                btoa: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                React: "readonly",
                NextResponse: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "no-console": "off",
        },
    },
];
