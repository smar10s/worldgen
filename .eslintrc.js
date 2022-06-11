module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        // solution to callback hell isn't more callbacks
        indent: ['error', 4],

        // loading files directly via browser
        'import/extensions': ['error', 'ignorePackages'],

        // some expressions just look better on one line
        'max-len': ['error', { code: 120, ignoreTemplateLiterals: true, ignoreUrls: true }],
    },
};
