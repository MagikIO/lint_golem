const tseslint = require('typescript-eslint');
const { LintGolem } = require('./dist/index.js');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: './tsconfig.eslint.json',
    ignoreGlobs: ['dist/**/*', 'node_modules/**/*'],
    "disabledRules": [
      "@typescript-eslint/no-require-imports",
      "@typescript-eslint/no-var-requires",
    ]
  }).config
);
