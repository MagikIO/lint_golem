# Lint Golem

[![Test](https://github.com/MagikIO/lint_golem/actions/workflows/test.yml/badge.svg)](https://github.com/MagikIO/lint_golem/actions/workflows/test.yml)
[![Dependency review](https://github.com/MagikIO/lint_golem/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/MagikIO/lint_golem/actions/workflows/dependency-review.yml)
[![npm version](https://badge.fury.io/js/%40magik_io%2Flint_golem.svg)](https://www.npmjs.com/package/@magik_io/lint_golem)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**Lint Golem** is an opinionated ESLint flat configuration generator designed for MagikIO projects. It provides a ready-to-use, type-aware ESLint setup that integrates:

- **TypeScript ESLint** - Full type-aware linting with recommended rules
- **eslint-plugin-n** - Node.js best practices and module resolution
- **Prettier Integration** - Consistent code formatting via eslint-config-prettier
- **ESLint Core** - JavaScript recommended rules

The main goal is to provide sensible defaults while allowing easy customization of any rule.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [API Reference](#api-reference)
- [Default Rules](#default-rules)
- [Architecture](#architecture)
- [Examples](#examples)
- [Development](#development)
- [Testing](#testing)
- [Publishing](#publishing)
- [License](#license)

---

## Requirements

- **Node.js** 22 or later
- **pnpm** 9.x (recommended package manager)
- **ESLint** 9.x (flat config support)
- **typescript-eslint** 8.x
- **TypeScript** 5.x (for type-aware linting)

---

## Installation

### pnpm (recommended)

```bash
pnpm add @magik_io/lint_golem typescript-eslint eslint -D
```

### npm

```bash
npm install --save-dev @magik_io/lint_golem typescript-eslint eslint
```

### yarn

```bash
yarn add @magik_io/lint_golem typescript-eslint eslint -D
```

---

## Quick Start

Create an `eslint.config.js` (or `eslint.config.mjs`) file in your project root:

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json']
  }).config
);
```

That's it! You now have a fully configured ESLint setup with TypeScript support.

---

## Configuration Options

### LintGolemOptions Interface

```typescript
interface LintGolemOptions {
  // REQUIRED: Project root directory
  rootDir: string;

  // REQUIRED: Path(s) to TypeScript configuration files
  tsconfigPaths: string[];

  // Optional: Additional glob patterns to ignore during linting
  ignoreGlobs?: string[];

  // Optional: Glob patterns for files to skip type checking
  disableTypeCheckOn?: string[];

  // Optional: Array of rule names to disable
  disabledRules?: string[];

  // Optional: Rule configurations to override
  rules?: Record<string, ['off' | 'error' | 'warn', ...any[]]>;

  // Optional: Use TypeScript project service (experimental)
  useProjectService?: boolean;

  // Optional: Enable JSX parsing
  jsx?: boolean;

  // Optional: ECMAScript version target
  ecmaVersion?: 6 | 7 | 8 | 9 | 10 | 11 | 12 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest';
}
```

### Option Details

#### `rootDir` (required)
The root directory of your project. This is used as the base for resolving TypeScript configuration paths.

```javascript
rootDir: __dirname  // CommonJS
rootDir: import.meta.dirname  // ESM
```

#### `tsconfigPaths` (required)
Array of paths to your TypeScript configuration files, relative to `rootDir`.

```javascript
tsconfigPaths: ['tsconfig.json']
// or multiple configs
tsconfigPaths: ['tsconfig.json', 'tsconfig.frontend.json']
```

#### `ignoreGlobs` (optional)
Additional glob patterns for files/directories to ignore. These are merged with the default ignore patterns.

```javascript
ignoreGlobs: [
  'src/**/*.test.ts',
  'fixtures/**/*',
  'legacy/**/*'
]
```

#### `disableTypeCheckOn` (optional)
Glob patterns for files where type checking should be disabled. Useful for JavaScript files or files that cause type errors.

```javascript
disableTypeCheckOn: [
  'src/legacy/**/*.ts',
  'migrations/**/*.ts'
]
```

Default: `['**/*.js', '**/*.mjs', '**/*.cjs']`

#### `disabledRules` (optional)
Array of rule names to disable completely.

```javascript
disabledRules: [
  'no-console',  // ESLint core
  'n/no-process-exit',  // Node plugin
  '@typescript-eslint/no-explicit-any'  // TypeScript ESLint
]
```

#### `rules` (optional)
Custom rule configurations to override defaults.

```javascript
rules: {
  'no-console': ['warn'],
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': ['error'],
  'n/no-process-exit': ['warn']
}
```

#### `useProjectService` (optional)
Enable TypeScript's experimental project service for better performance with large codebases.

```javascript
useProjectService: true
```

#### `jsx` (optional)
Enable JSX parsing support for React/JSX projects.

```javascript
jsx: true
```

#### `ecmaVersion` (optional)
Specify the ECMAScript version to use for parsing. Defaults to `'latest'`.

```javascript
ecmaVersion: 2022
```

---

## API Reference

### `LintGolem` Class

#### Constructor

```typescript
new LintGolem(options: LintGolemOptions): LintGolem
```

Creates a new LintGolem instance with the specified configuration.

**Throws:** `LintGolemError` if a rule appears in both `disabledRules` and `rules`.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `rootDir` | `string` | Project root directory |
| `tsconfigPaths` | `string[]` | TypeScript config file paths |
| `ignoreGlobs` | `string[]` | All ignore patterns (defaults + custom) |
| `disableTypeCheckOn` | `string[]` | Files to skip type checking |
| `eslintRules` | `object` | Merged ESLint core rules |
| `nodeRules` | `object` | Merged eslint-plugin-n rules |
| `typescriptRules` | `object` | Merged TypeScript ESLint rules |
| `rules` | `object` | All merged rules from all sources |

#### Getters

##### `.config`

```typescript
get config(): readonly [ignoresObject, ...configObjects]
```

Returns the complete ESLint flat configuration array. This is what you spread into `tseslint.config()`.

##### `.ignoresObject`

```typescript
get ignoresObject(): { ignores: string[] }
```

Returns the ignore patterns configuration object.

##### `.disabledFilesObject`

```typescript
get disabledFilesObject(): { files: string[], ...disableTypeChecked }
```

Returns the configuration for files with disabled type checking.

##### `.langOptsObject`

```typescript
get langOptsObject(): { languageOptions: { ecmaVersion, parserOptions } }
```

Returns the language options configuration object.

##### `.rulesObject`

```typescript
get rulesObject(): { languageOptions, rules }
```

Returns the combined language options and rules object.

#### Static Methods

##### `LintGolem.init()`

```typescript
static async init(
  config: Omit<LintGolemOptions, 'tsconfigPaths'> & { tsconfigPaths?: string[] },
  verbose?: boolean
): Promise<LintGolem>
```

Factory method that auto-discovers TypeScript configuration files using glob patterns.

```javascript
// Auto-discover tsconfig files
const golem = await LintGolem.init({
  rootDir: __dirname,
  // tsconfigPaths is optional here
});

// With verbose logging
const golem = await LintGolem.init({ rootDir: __dirname }, true);
```

Searches for:
- `tsconfig.json`
- `*.tsconfig.json`
- Any paths provided in `tsconfigPaths`

**Throws:** Error if no tsconfig files are found.

### `LintGolemError` Class

```typescript
class LintGolemError extends Error {
  cause: string;           // Rule name causing conflict
  matchSource: string[];   // Array of conflicting rules
  incomingRule: object;    // The conflicting rule configuration
}
```

Thrown when a rule is both disabled and modified, indicating a configuration conflict.

---

## Default Rules

### Default Ignore Patterns

The following patterns are ignored by default:

```
**/gen                    - Generated files
**/*.map.js              - Source maps
**/*.js.map              - Source maps
**/*.mjs.map             - Source maps
**/dist                  - Build output
**/.stylelintrc          - Stylelint config
**/CHANGELOG.md          - Changelog
**/coverage              - Test coverage
**/docs                  - Documentation
**/.github               - GitHub config
**/.vscode               - VS Code config
**/logs                  - Log files
**/.nyc                  - NYC coverage
**/.nyc_output           - NYC output
**/.yarn                 - Yarn cache
**/public/bundle/*       - Public bundles
**/node_modules/**       - Dependencies
**/.git/objects/**       - Git objects
```

### Disabled ESLint Core Rules (23 rules)

```
arrow-body-style            camelcase
class-methods-use-this      consistent-return
func-names                  indent
lines-between-class-members max-classes-per-file
newline-per-chained-call    no-bitwise
no-console                  no-inner-declarations
no-lonely-if                no-nested-ternary
no-new                      no-param-reassign
no-plusplus                 no-prototype-builtins
no-restricted-syntax        no-underscore-dangle
no-unused-expressions       no-useless-escape
object-shorthand            one-var
one-var-declaration-per-line spaced-comment
```

### Modified ESLint Core Rules

```javascript
{
  'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
  'object-curly-newline': ['error', { multiline: true, consistent: true }],
  'no-shadow': ['error', { hoist: 'never' }]
}
```

### Disabled TypeScript ESLint Rules (18 rules)

```
@typescript-eslint/indent
@typescript-eslint/no-redundant-type-constituents
@typescript-eslint/consistent-type-definitions
@typescript-eslint/explicit-module-boundary-types
@typescript-eslint/no-explicit-any
@typescript-eslint/ban-ts-comment
@typescript-eslint/no-var-requires
@typescript-eslint/no-unsafe-call
@typescript-eslint/no-unsafe-assignment
@typescript-eslint/no-unsafe-member-access
@typescript-eslint/unbound-method
@typescript-eslint/restrict-template-expressions
@typescript-eslint/no-misused-promises
@typescript-eslint/array-type
@typescript-eslint/no-unnecessary-type-assertion
@typescript-eslint/lines-between-class-members
@typescript-eslint/naming-convention
@typescript-eslint/no-require-imports
```

### Modified TypeScript ESLint Rules

```javascript
{
  '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: false }]
}
```

### Disabled Node Plugin Rules (5 rules)

```
n/no-missing-import
n/no-unpublished-require
n/no-unpublished-import
n/no-extraneous-import
n/no-extraneous-require
```

---

## Architecture

### How Lint Golem Works

1. **Configuration Aggregation**: Combines multiple ESLint configuration sources into a single flat config array

2. **Rule Merging**: Merges default disabled rules with user customizations, separating rules by plugin namespace

3. **Conflict Detection**: Validates that no rule is both disabled and modified, throwing `LintGolemError` if found

4. **Config Generation**: Produces a ready-to-use ESLint flat config array containing:
   - Ignore patterns
   - ESLint recommended rules
   - TypeScript ESLint recommended type-checked rules
   - Node.js plugin recommended rules
   - Prettier compatibility layer
   - Custom rules and language options
   - Type checking disabled files configuration

### Generated Configuration Structure

```javascript
[
  { ignores: [...] },                        // Ignore patterns
  eslint.configs.recommended,                 // ESLint core rules
  ...tseslint.configs.recommendedTypeChecked, // TypeScript rules
  pluginN.configs['flat/recommended-script'], // Node.js rules
  prettierConfig,                             // Prettier compatibility
  { languageOptions: {...}, rules: {...} },  // Custom overrides
  { files: [...], ...disableTypeChecked }    // Type-check disabled files
]
```

### Module System

Lint Golem is distributed as a dual-format package:
- **ESM**: `dist/index.mjs`
- **CommonJS**: `dist/index.cjs`
- **TypeScript Declarations**: `dist/index.d.ts`

---

## Examples

### Basic Setup

```javascript
// eslint.config.js
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json']
  }).config
);
```

### React/JSX Project

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json'],
    jsx: true,
    ignoreGlobs: ['public/**/*']
  }).config
);
```

### Multiple TypeScript Configs

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: [
      'tsconfig.json',
      'tsconfig.node.json',
      'tsconfig.test.json'
    ]
  }).config
);
```

### Custom Rules

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json'],
    // Disable specific rules
    disabledRules: [
      'no-console',
      '@typescript-eslint/no-explicit-any'
    ],
    // Modify rule configurations
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn'],
      'n/no-process-exit': ['off']
    }
  }).config
);
```

### Auto-Discovery with Init

```javascript
// eslint.config.js
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

// Using top-level await (ESM)
const golem = await LintGolem.init({
  rootDir: import.meta.dirname
});

export default tseslint.config(...golem.config);
```

### ESM Configuration

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';
import { LintGolem } from '@magik_io/lint_golem';

export default tseslint.config(
  ...new LintGolem({
    rootDir: import.meta.dirname,
    tsconfigPaths: ['tsconfig.json']
  }).config
);
```

### Excluding Test Files from Type Checking

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json'],
    disableTypeCheckOn: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**/*.ts'
    ]
  }).config
);
```

### Monorepo Setup

```javascript
const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: [
      'packages/core/tsconfig.json',
      'packages/cli/tsconfig.json',
      'packages/web/tsconfig.json'
    ],
    ignoreGlobs: [
      '**/packages/*/dist/**',
      '**/packages/*/node_modules/**'
    ]
  }).config
);
```

---

## Development

### Project Structure

```
lint_golem/
├── src/
│   ├── index.ts           # Main LintGolem class
│   └── LintGolemError.ts  # Custom error class
├── test/
│   └── index.test.ts      # Unit tests
├── dist/                   # Compiled output (generated)
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Test configuration
└── eslint.config.js       # Self-linting config
```

### Building

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build
```

The build uses `unbuild` with `esbuild` to generate:
- ESM bundle: `dist/index.mjs`
- CommonJS bundle: `dist/index.cjs`
- TypeScript declarations: `dist/index.d.ts`

### Code Quality

Lint Golem uses its own configuration for linting:

```javascript
// eslint.config.js
const tseslint = require('typescript-eslint');
const { LintGolem } = require('./dist/index.cjs');

module.exports = tseslint.config(
  ...new LintGolem({
    rootDir: __dirname,
    tsconfigPaths: ['tsconfig.json'],
    disabledRules: ['@typescript-eslint/no-require-imports']
  }).config
);
```

---

## Testing

### Running Tests

```bash
# Run tests with coverage (recommended)
pnpm test

# Or using npm/yarn
npm test
yarn test
```

### Test Framework

- **Framework**: Vitest
- **Coverage**: V8 provider
- **Reports**: text, json-summary, json

### Test Coverage

The test suite covers:
- Constructor initialization and validation
- Default and custom ignore patterns
- TSConfig path handling
- Auto-discovery with `init()`
- Rule disabling for all plugin types
- Rule modification conflicts
- Configuration object generation
- Error handling

### CI/CD

GitHub Actions workflows:
- **test.yml**: Runs tests on pull requests with coverage comparison (uses pnpm)
- **dependency-review.yml**: Checks for vulnerable dependencies

---

## Publishing

### Version Management

```bash
# Bump version, commit, tag, and publish
pnpm run iterate
```

This script:
1. Updates version in package.json
2. Creates git commit
3. Creates git tag
4. Pushes to remote
5. Publishes to npm

### NPM Package

- **Package**: `@magik_io/lint_golem`
- **Registry**: npm public registry
- **Files included**: `dist/` directory only
- **Side effects**: None (tree-shakeable)

---

## Troubleshooting

### Common Issues

#### "Rule is disabled and modified"

```
LintGolemError: Rule no-console is disabled and modified
```

**Solution**: Remove the rule from either `disabledRules` or `rules`, not both.

#### "No tsconfig.json found"

**Solution**: Ensure `tsconfigPaths` points to valid TypeScript configuration files relative to `rootDir`.

#### Type checking errors on JavaScript files

**Solution**: JavaScript files are disabled from type checking by default. If you need to type check JS files, remove them from `disableTypeCheckOn`:

```javascript
disableTypeCheckOn: []  // Enable type checking on all files
```

#### Peer dependency warnings

**Solution**: Ensure you have the required peer dependencies installed:

```bash
npm install --save-dev eslint typescript-eslint
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `pnpm install`
4. Make your changes
5. Ensure tests pass: `pnpm test`
6. Build: `pnpm build`
7. Submit a pull request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Antonio B.**
- Email: Abourassa@AssetVal.com
- GitHub: [@Abourass](https://github.com/Abourass)

---

## Acknowledgments

- [ESLint](https://eslint.org/) - The pluggable linting utility
- [TypeScript ESLint](https://typescript-eslint.io/) - TypeScript support for ESLint
- [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n) - Node.js linting rules
- [Prettier](https://prettier.io/) - Opinionated code formatter
