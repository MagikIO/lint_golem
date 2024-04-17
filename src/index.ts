// @ts-expect-error
import eslint from '@eslint/js';
import plugin_n from 'eslint-plugin-n';
import { sync as globSync } from 'fast-glob';
import tseslint from 'typescript-eslint';

interface LintGolemOptions {
  rootDir: string;
  ignoreGlobs?: string[];
  projectRoots?: string[];
  disableTypeCheckOn?: string[];
  rules?: Record<string, string | Array<any>>;
}

export default class LintGolem {
  protected rootDir: string = process.cwd();
  protected ignoreGlobs: string[] = [
    '**/gen',
    '**/*.map.js',
    '**/*.js.map',
    '**/*.mjs.map',
    '**/node_modules',
    '**/dist',
    '**/.stylelintrc',
    '**/CHANGELOG.md',
    '**/coverage',
    '**/docs',
    '**/.github',
    '**/.vscode',
    '**/logs',
    '**/.nyc',
    '**/.nyc_output',
    '**/.yarn',
    '**/public/bundle/*',
  ];

  protected projectRoots: string[] = globSync([
    `${this.rootDir}/tsconfig.json`,
    `${this.rootDir}/*.tsconfig.json`,
  ])

  protected disableTypeCheckOn: string[] = [
    '**/*.js',
    '**/*.mjs',
    '**/*.cjs',
  ];

  protected rules = {
    "@typescript-eslint/indent": "off",
    "indent": "off",
    "@typescript-eslint/no-redundant-type-constituents": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-inferrable-types': ['error', {
      ignoreParameters: false,
    }],
    '@typescript-eslint/no-var-requires': "off",
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    // Leave these two to prettier
    "lines-between-class-members": "off",
    "@typescript-eslint/lines-between-class-members": "off",
    // Enforce naming conventions (Leave to ts-rule below)
    "camelcase": "off",
    "@typescript-eslint/naming-convention": "off",
    'object-shorthand': 'off',
    'n/no-missing-import': 'off',
    'n/no-unsupported-features/es-syntax': [
      'error',
      {
        ignores: [
          'dynamicImport',
          'modules',
        ],
      },
    ],
    'no-nested-ternary': 'off',
    'arrow-parens': [
      'error',
      'as-needed',
      {
        requireForBlockBody: true,
      },
    ],
    'no-sequences': 'error',
    'one-var': 'off',
    'class-methods-use-this': 'off',
    'one-var-declaration-per-line': 'off',
    'consistent-return': 'off',
    'func-names': 'off',
    // 'max-len': 'off',
    'no-unused-expressions': 'off',
    'no-console': 'off',
    'arrow-body-style': 'off',
    'no-shadow': [
      'error',
      { hoist: 'never' },
    ],
    'no-restricted-syntax': 'off',
    'no-inner-declarations': 'off',
    'no-param-reassign': 'off',
    'no-prototype-builtins': 'off',
    'no-new': 'off',
    'newline-per-chained-call': 'off',
    'no-lonely-if': 'off',
    'no-plusplus': 'off',
    'no-bitwise': 'off',
    'object-curly-newline': [
      'error',
      { multiline: true, consistent: true },
    ],
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    'spaced-comment': 'off',
    "no-constant-binary-expression": "error",
  };


  constructor({ rootDir, disableTypeCheckOn, ignoreGlobs, projectRoots, rules }: LintGolemOptions) {
    this.rootDir = rootDir ?? this.rootDir;
    if (ignoreGlobs) this.ignoreGlobs = [...this.ignoreGlobs, ...ignoreGlobs];
    if (projectRoots) this.projectRoots = [...this.projectRoots, ...projectRoots];
    if (disableTypeCheckOn) this.disableTypeCheckOn = [...this.disableTypeCheckOn, ...disableTypeCheckOn];
    if (rules) this.rules = { ...this.rules, ...rules };
  }

  get ignoresObject() {
    return {
      ignores: this.ignoreGlobs,
    }
  }

  get disabledFilesObject() {
    return {
      files: this.disableTypeCheckOn,
      ...tseslint.configs.disableTypeChecked,
    }
  }

  get langOptsObject() {
    return {
      languageOptions: {
        ecmaVersion: 'latest',
        parserOptions: {
          project: this.projectRoots,
          tsconfigRootDir: this.rootDir,
        }
      }
    }
  }

  get rulesObject() {
    return {
      ...this.langOptsObject,
      rules: this.rules,
    }
  }

  get config() {
    return [
      this.ignoresObject,
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      plugin_n.configs['flat/recommended-script'],
      this.rulesObject,
      this.disabledFilesObject,
    ]
  }
}
