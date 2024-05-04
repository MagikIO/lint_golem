# Lint Golem

[![Test](https://github.com/MagikIO/lint_golem/actions/workflows/test.yml/badge.svg)](https://github.com/MagikIO/lint_golem/actions/workflows/test.yml)
[![Dependency review](https://github.com/MagikIO/lint_golem/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/MagikIO/lint_golem/actions/workflows/dependency-review.yml)

## Description

Lint Golem is the eslint flat config generator for the MagikIO projects.
It generates an opinionated eslint config, with the following plugins:

- typescript-eslint (for typescript support, with type-aware linting)
- eslint-plugin-prettier (for prettier integration)
- eslint-plugin-n (for nodejs linting)

## Installation

```npm
npm install --save-dev @magik_io/lint_golem typescript-eslint eslint
```

```yarn
yarn add @magik_io/lint_golem typescript-eslint eslint -D
```

```pnpm
pnpm add @magik_io/lint_golem typescript-eslint eslint -D
```

## Usage

Lint Golem allows you to modify or turn off any rule that you would like, in an extremely simple way.

```typescript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    // This is the only REQUIRED field; It should be `__dirname` or `import.meta.url`
    rootDir: __dirname,
    /** Optional fields */
    /** By default, it will look glob search for tsconfig.json / tsconfig.*.json in the root dir,
     * if your tsconfig is in a different location, you can specify it here */
    tsconfigPaths: [
      'tsconfig.json',
      'tsconfig.frontend.json'
    ],
    /** To disable type checking on specific files, you can specify them here */
    disableTypeCheckOn: [
      'src/test.ts'
    ],
    /** To ignore files / paths from linting, specify them here */
    ignoreGlobs: [
      'src/*.test.ts'
    ],
    /** To disable a rule, simply add it to the disabledRules array */
    disabledRules: [
      'no-console'
    ],
    /** To modify a rule just specify it in the rules object */
    rules: {
      'no-class-assign': 'warn'
    },
    /* Dont forget to end your call with `.config` */
  }).config
)
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
