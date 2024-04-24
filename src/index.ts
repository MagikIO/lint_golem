import eslint from '@eslint/js';
import plugin_n from 'eslint-plugin-n';
import { sync as globSync } from 'fast-glob';
import tseslint from 'typescript-eslint';

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

  private mergeNewRules<
    Action extends 'disable' | 'change' = 'disable' | 'change',
    Collection extends 'Typescript' | 'Node' | 'Eslint' = 'Typescript' | 'Node' | 'Eslint'
  >(rules: Action extends 'disable' ? DisabledRuleArray : EslintModifiedRule, action: Action, collection: Collection) {
    if (!rules) return;
    if (action === 'change' && !Object.keys(rules).length) return;
    if (action === 'disable' && !rules.length) return;

    function lowerCaseStr<Label extends string = string>(str: Label): Lowercase<Label> {
      return str.toLocaleLowerCase() as Lowercase<Label>;
    }
    type DisabledCollections = '_disabledTypescriptRules' | '_disabledNodeRules' | '_disabledEslintRules';
    type ModifiedCollections = '_typescriptModifiedRules' | '_nodeModifiedRules' | '_eslintModifiedRules';
    type RuleCollections = 'typescriptRules' | 'nodeRules' | 'eslintRules';
    const disabledTargetLabel = `_disabled${collection}Rules` as DisabledCollections;
    const modificationTargetLabel = `_${lowerCaseStr(collection)}ModifiedRules` as ModifiedCollections;

    if (action === 'disable' && Array.isArray(rules) && rules.every(rule => typeof rule === 'string')) {
      const disabledTarget = this[disabledTargetLabel];
      const newRules = (rules as Array<string>).filter(rule => !disabledTarget.includes(rule));
      this[disabledTargetLabel] = [...disabledTarget, ...newRules];
    }

    if (action === 'change') {
      const modificationTarget = this[modificationTargetLabel];
      this[modificationTargetLabel] = {
        ...modificationTarget,
        ...rules as EslintModifiedRule,
      }
    }

    const ruleTargetLabel = `${lowerCaseStr(collection)}Rules` as RuleCollections;
    const ruleTarget = this[ruleTargetLabel];
    this[ruleTargetLabel] = {
      ...ruleTarget,
      ...this[modificationTargetLabel],
      ...this[disabledTargetLabel].reduce((acc, rule) => {
        acc[rule] = 'off';
        return acc;
      }, {} as Record<string, string>),
    }
  }

  private _disabledTypescriptRules = [
    '@typescript-eslint/indent', '@typescript-eslint/no-redundant-type-constituents', '@typescript-eslint/consistent-type-definitions', '@typescript-eslint/explicit-module-boundary-types',
    '@typescript-eslint/no-explicit-any', '@typescript-eslint/ban-ts-comment', '@typescript-eslint/no-var-requires', '@typescript-eslint/no-unsafe-call', '@typescript-eslint/no-unsafe-assignment',
    '@typescript-eslint/no-unsafe-member-access', '@typescript-eslint/unbound-method', '@typescript-eslint/restrict-template-expressions', '@typescript-eslint/no-misused-promises',
    '@typescript-eslint/array-type', '@typescript-eslint/no-unnecessary-type-assertion', '@typescript-eslint/lines-between-class-members', '@typescript-eslint/naming-convention',
  ]
  public get disabledTypescriptRules() { return this._disabledTypescriptRules; }
  public set disabledTypescriptRules(rules: DisabledRuleArray) { this.mergeNewRules(rules, 'disable', 'Typescript'); }

  private _typescriptModifiedRules: EslintModifiedRule = {
    '@typescript-eslint/no-inferrable-types': ['error', {
      ignoreParameters: false,
    }],
  }
  public get typescriptModifiedRules() { return this._typescriptModifiedRules; }
  public set typescriptModifiedRules(rules: EslintModifiedRule) { this.mergeNewRules(rules, 'change', 'Typescript'); }

  public typescriptRules = {
    ...this.typescriptModifiedRules,
    ...this._disabledTypescriptRules.reduce((acc, rule) => {
      acc[rule] = 'off';
      return acc;
    }, {} as Record<string, string>),
  }

  private _disabledNodeRules = ['n/no-missing-import'];
  public get disabledNodeRules() { return this._disabledNodeRules; }
  public set disabledNodeRules(rules: string[]) { this.mergeNewRules(rules, 'disable', 'Node'); }

  private _nodeModifiedRules: EslintModifiedRule = {
    "n/no-unpublished-import": ["error", {
      "allowModules": ['vitest'],
    }]
  }
  public get nodeModifiedRules() { return this._nodeModifiedRules; }
  public set nodeModifiedRules(rules: EslintModifiedRule) { this.mergeNewRules(rules, 'change', 'Node'); }

  public nodeRules = {
    ...this.nodeModifiedRules,
    ...this._disabledNodeRules.reduce((acc, rule) => {
      acc[rule] = 'off';
      return acc;
    }, {} as Record<string, string>),
  }

  private _disabledEslintRules = ['indent', 'lines-between-class-members', 'camelcase', 'object-shorthand', 'no-nested-ternary', 'one-var',
    'class-methods-use-this', 'one-var-declaration-per-line', 'consistent-return', 'func-names', 'no-unused-expressions', 'no-console', 'arrow-body-style',
    'no-restricted-syntax', 'no-inner-declarations', 'no-param-reassign', 'no-prototype-builtins', 'no-new', 'newline-per-chained-call', 'no-lonely-if', 'no-plusplus', 'no-bitwise',
    'no-underscore-dangle', 'max-classes-per-file', 'spaced-comment'];
  public get disabledEslintRules() { return this._disabledEslintRules; }
  public set disabledEslintRules(rules: string[]) { this.mergeNewRules(rules, 'disable', 'Eslint'); }

  private _eslintModifiedRules: EslintModifiedRule = {
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
  public get eslintModifiedRules() { return this._eslintModifiedRules; }
  public set eslintModifiedRules(rules: EslintModifiedRule) { this.mergeNewRules(rules, 'change', 'Eslint'); }

  public eslintRules = {
    ...this.eslintModifiedRules,
    ...this._disabledEslintRules.reduce((acc, rule) => {
      acc[rule] = 'off';
      return acc;
    }, {} as Record<string, string>),
  }

  public rules = {
    ...this.typescriptRules,
    ...this.nodeRules,
    ...this.eslintRules,
  };


  constructor({ rootDir, disableTypeCheckOn, ignoreGlobs, projectRoots, rules, disabledRules }: LintGolemOptions) {
    this.rootDir = rootDir ?? this.rootDir;
    if (ignoreGlobs) this.ignoreGlobs = [...this.ignoreGlobs, ...ignoreGlobs];
    if (projectRoots) this.projectRoots = [...this.projectRoots, ...projectRoots];
    if (disableTypeCheckOn) this.disableTypeCheckOn = [...this.disableTypeCheckOn, ...disableTypeCheckOn];
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

      if (typescriptRules.length > 0) this.disabledTypescriptRules = typescriptRules;
      if (nodeRules.length > 0) this.disabledNodeRules = nodeRules;
      if (eslintRules.length > 0) this.disabledEslintRules = eslintRules;
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
}
