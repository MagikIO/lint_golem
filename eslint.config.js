const tseslint = require('typescript-eslint');
const { LintGolem } = require('./dist/index.cjs');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json'],
    ecmaVersion: 2022,
    "disabledRules": [
      "@typescript-eslint/no-require-imports",
      "@typescript-eslint/no-var-requires",
    ]
  }).config
);
