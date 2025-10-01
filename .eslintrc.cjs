module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'svelte'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  overrides: [{ files: ['*.svelte'], processor: 'svelte3/svelte3' }],
  rules: {
    semi: ['error', 'never']
  }
}
