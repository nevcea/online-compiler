import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        ignores: [
            'node_modules/**',
            'backend/node_modules/**',
            'frontend/node_modules/**',
            'backend/code/**',
            'backend/output/**',
            'dist/**',
            'frontend/dist/**',
            'build/**',
            '*.min.js',
            'coverage/**'
        ]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                monaco: 'readonly',
                require: 'readonly',
                ace: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'off',
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-constant-condition': 'warn',
            'no-useless-escape': 'warn',
            'no-prototype-builtins': 'warn',
            'no-case-declarations': 'warn',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            indent: ['warn', 4, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral'] }],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'warn',
            'eol-last': ['warn', 'always'],
            'object-curly-spacing': ['warn', 'always'],
            'array-bracket-spacing': ['warn', 'never'],
            'space-before-blocks': 'warn',
            'keyword-spacing': 'warn',
            'space-infix-ops': 'warn',
            'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
            curly: ['warn', 'all'],
            'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
            'padded-blocks': ['warn', 'never'],
            'space-before-function-paren': [
                'warn',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            'max-len': 'off',
            complexity: 'off',
            'no-magic-numbers': 'off'
        }
    },
    {
        files: ['scripts/**/*.cjs'],
        rules: {
            indent: 'off',
            'no-console': 'off'
        }
    },
    {
        files: ['backend/**/*.js'],
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
        }
    },
    {
        files: ['frontend/**/*.{js,jsx}'],
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
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
        }
    },
    {
        files: ['frontend/src/context/AppContext.jsx'],
        rules: {
            'react-refresh/only-export-components': 'off'
        }
    }
];
