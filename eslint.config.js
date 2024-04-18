const { LintGolem } = require('./dist/index.js');

module.exports = new LintGolem({
  rootDir: __dirname,
  projectRoots: ['./tsconfig.eslint.json'],
}).config;
