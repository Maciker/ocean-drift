import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
}

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.quality/**',
      '.sandbox/**',
      '**/workspace/**',
      '.cursor/**',
      'cursor/**',
      '.github/prompts/**',
      '.github/instructions/**',
      'github/prompts/**',
      'github/instructions/**',
      '.codex/**',
      'codex/**',
      '.hermes/**',
      'hermes/**',
      '.agents/**',
      'agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...nodeGlobals,
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
      },
    },
  },
)
