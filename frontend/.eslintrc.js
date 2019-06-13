module.exports = {
    root: true,
    env: {
        node: true,
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:vue/recommended', '@vue/prettier', '@vue/eslint-config-typescript'],
    rules: {
        'no-console': 'off', // process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
    },
};
