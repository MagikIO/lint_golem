const tseslint = require('typescript-eslint');
const { LintGolem } = require('./dist/index.js');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: [
      './tsconfig.eslint.json'
    ],
  }).config
);
