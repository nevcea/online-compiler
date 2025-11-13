import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
    {
        ignores: ['node_modules/**', 'dist/**', 'build/**']
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module'
            }
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true, allowExportNames: ['useApp'] }
            ],
            'no-unused-vars': 'off'
        }
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
                project: resolve(__dirname, 'tsconfig.json')
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
        }
    },
    {
        files: ['vite.config.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: resolve(__dirname, 'tsconfig.node.json')
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            'no-undef': 'off'
        }
    },
    {
        files: ['src/context/AppContext.{jsx,tsx}'],
        rules: {
            'react-refresh/only-export-components': 'off'
        }
    }
];
