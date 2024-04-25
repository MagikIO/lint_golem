/* eslint-disable no-useless-escape */
import eslint from '@eslint/js';
import plugin_n from 'eslint-plugin-n';
import { sync as globSync } from 'fast-glob';
import tseslint from 'typescript-eslint';
import { LintGolemError } from './LintGolemError.js';

type PluginPrefixes = 'n/' | '@typescript-eslint/';

type EslintOption = Record<string, boolean | string | Array<any>>;
type EslintModifiedRule = Record<string | `${PluginPrefixes}string`, [action: 'off' | 'error' | 'warn', ...Array<string | EslintOption>]>;
type DisabledRuleArray = Array<string>;

interface LintGolemOptions {
  rootDir: string;
  ignoreGlobs?: string[];
  projectRoots?: string[];
  disableTypeCheckOn?: string[];
  disabledRules?: DisabledRuleArray;
  rules?: EslintModifiedRule;
}

export interface Types {
  EslintOption: EslintOption;
  EslintModifiedRule: EslintModifiedRule;
  DisabledRuleArray: DisabledRuleArray;
  LintGolemOptions: LintGolemOptions;
}

export class LintGolem {
  public rootDir: string = process.cwd();
  public ignoreGlobs: string[] = [
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

  public projectRoots: string[] = globSync([
    `${this.rootDir}/tsconfig.json`,
    `${this.rootDir}/*.tsconfig.json`,
  ])

  public disableTypeCheckOn: string[] = [
    '**/*.js',
    '**/*.mjs',
    '**/*.cjs',
  ];

  public disabledTypescriptRules = [
    '@typescript-eslint/indent', '@typescript-eslint/no-redundant-type-constituents', '@typescript-eslint/consistent-type-definitions', '@typescript-eslint/explicit-module-boundary-types',
    '@typescript-eslint/no-explicit-any', '@typescript-eslint/ban-ts-comment', '@typescript-eslint/no-var-requires', '@typescript-eslint/no-unsafe-call', '@typescript-eslint/no-unsafe-assignment',
    '@typescript-eslint/no-unsafe-member-access', '@typescript-eslint/unbound-method', '@typescript-eslint/restrict-template-expressions', '@typescript-eslint/no-misused-promises',
    '@typescript-eslint/array-type', '@typescript-eslint/no-unnecessary-type-assertion', '@typescript-eslint/lines-between-class-members', '@typescript-eslint/naming-convention',
  ]
  public typescriptModifiedRules: EslintModifiedRule = {
    '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: false }],
  }
  public get typescriptRules() {
    return {
      ...this.typescriptModifiedRules,
      ...this.disabledTypescriptRules.reduce((acc, rule) => {
        acc[rule] = 'off';
        return acc;
      }, {} as Record<string, string>),
    }
  }

  public disabledNodeRules = ['n/no-missing-import'];
  public nodeModifiedRules: EslintModifiedRule = {
    "n/no-unpublished-import": ["error", {
      "allowModules": ['vitest'],
    }]
  }
  public get nodeRules() {
    return {
      ...this.nodeModifiedRules,
      ...this.disabledNodeRules.reduce((acc, rule) => {
        acc[rule] = 'off';
        return acc;
      }, {} as Record<string, string>),
    }
  }

  public disabledEslintRules = ['arrow-body-style', 'camelcase', 'class-methods-use-this', 'consistent-return', 'func-names', 'indent', 'lines-between-class-members',
    'max-classes-per-file', 'newline-per-chained-call', 'no-bitwise', 'no-console', 'no-inner-declarations', 'no-lonely-if', 'no-nested-ternary', 'no-new', 'no-param-reassign', 'no-plusplus',
    'no-prototype-builtins', 'no-restricted-syntax', 'no-underscore-dangle', 'no-unused-expressions', 'object-shorthand', 'one-var', 'one-var-declaration-per-line', 'spaced-comment'];
  public eslintModifiedRules: EslintModifiedRule = {
    'arrow-parens': [
      'error',
      'as-needed',
      {
        requireForBlockBody: true,
      },
    ],
    'object-curly-newline': [
      'error',
      { multiline: true, consistent: true },
    ],
    'no-shadow': [
      'error',
      { hoist: 'never' },
    ],
  }
  public get eslintRules() {
    return {
      ...this.eslintModifiedRules,
      ...this.disabledEslintRules.reduce((acc, rule) => {
        acc[rule] = 'off';
        return acc;
      }, {} as Record<string, string>),
    }
  }

  public get rules() {
    return {
      ...this.eslintRules,
      ...this.nodeRules,
      ...this.typescriptRules,
    }
  }

  constructor({ rootDir, disableTypeCheckOn, ignoreGlobs, projectRoots, rules, disabledRules }: LintGolemOptions) {
    try {
      this.rootDir = rootDir ?? this.rootDir;
      this.projectRoots = projectRoots ?? this.projectRoots;
      if (ignoreGlobs) this.ignoreGlobs = [...this.ignoreGlobs, ...ignoreGlobs];
      if (disableTypeCheckOn) this.disableTypeCheckOn = [...this.disableTypeCheckOn, ...disableTypeCheckOn];
      if (rules && disabledRules) {
        Object.keys(rules).every((rule) => {
          if (disabledRules.includes(rule)) throw new LintGolemError(`Rule ${rule} is disabled and modified`, { cause: rule, matchSource: disabledRules, incomingRule: { [rule]: rules[rule] } })
        });
      }

      if (rules) {
        const typescriptRules = Object.keys(rules).filter(rule => rule.startsWith('@typescript-eslint/'));
        const nodeRules = Object.keys(rules).filter(rule => rule.startsWith('n/'));
        const eslintRules = Object.keys(rules).filter(rule => !rule.startsWith('@typescript-eslint/') && !rule.startsWith('n/'));

        if (typescriptRules.length > 0) this.typescriptModifiedRules = rules;
        if (nodeRules.length > 0) this.nodeModifiedRules = rules;
        if (eslintRules.length > 0) this.eslintModifiedRules = rules;
      }

      if (disabledRules) {
        const typescriptRules = disabledRules.filter(rule => rule.startsWith('@typescript-eslint/'));
        const nodeRules = disabledRules.filter(rule => rule.startsWith('n/'));
        const eslintRules = disabledRules.filter(rule => !rule.startsWith('@typescript-eslint/') && !rule.startsWith('n/'));

        if (typescriptRules.length > 0) this.disabledTypescriptRules = disabledRules;
        if (nodeRules.length > 0) this.disabledNodeRules = disabledRules;
        if (eslintRules.length > 0) this.disabledEslintRules = disabledRules;
      }
    } catch (error) {
      if (error instanceof LintGolemError) this.warnUserOfRuleIssue(error);
      throw error;
    }
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
    ] as const;
  }

  protected formatJSON(json: Record<string, any> | Array<string>) {
    return JSON.stringify(json, null, "\t");
  }

  protected styles = {
    lintGolemStyle: `background-color: #e636dc; color: #000; padding: 3px 2px; border-radius: 6px; font-weight: bold; font-size: 15px`,
    warningStyle: 'background-color: #ffcc00; color: #000; padding: 1px 2px; border-radius: 4px; font-weight: bold;',
    ruleNameStyle: `background-color: #000; color: #FFF; padding: 1px 2px; border-radius: 5px; font-weight: bold;`
  }

  protected get formatErrorAsString() {
    return `%c LintGolem Warning %c\n\%c Rule Disabled AND Modified %c\n  The rule: %c%s%c is set in both your \`rules\` object %s and your \`disabledRules\` array %s`;
  }

  protected warnUserOfRuleIssue(error: LintGolemError) {
    const { styles, formatErrorAsString, formatJSON } = this;
    const { lintGolemStyle, warningStyle, ruleNameStyle } = styles;
    const ruleName = error.cause;

    console.info(formatErrorAsString,
      lintGolemStyle,
      'reset',
      warningStyle,
      'reset',
      ruleNameStyle,
      ruleName,
      'reset',
      formatJSON(error.incomingRule),
      formatJSON(error.matchSource)
    );
  }
}
