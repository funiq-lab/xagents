import antfu from '@antfu/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

export default antfu(
  {
    react: {
      overrides: {
        'react-refresh/only-export-components': 'off',
      },
    },
    stylistic: true,
    typescript: {
      overrides: {
        'ts/no-unused-vars': ['warn', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        }],
        'ts/no-empty-object-type': ['warn', {
          allowInterfaces: 'always',
        }],
        'ts/consistent-type-imports': ['warn', {
          fixStyle: 'inline-type-imports',
        }],
        'ts/no-unused-expressions': ['error', {
        }],
      },
    },
  },
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  {
    rules: {
      'import/no-duplicates': ['warn', {
        'prefer-inline': true,
      }],
      'no-console': ['warn', {
        allow: ['info', 'error'],
      }],
      'unused-imports/no-unused-vars': 'off',
      'node/prefer-global/process': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/*',
      '**/.next/*',
      '**/.vscode/*',
      '**/output/*',
      '**/dist/*',
      '**/out/*',
      '*.md',
      'assets/fingerprint/fingerprintjsv3.js',
    ],
  },
)
