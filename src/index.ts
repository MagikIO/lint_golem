import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import plugin_n from 'eslint-plugin-n';
import globPkg from 'fast-glob';
import tseslint from 'typescript-eslint';
import { LintGolemError } from './LintGolemError';

const { glob } = globPkg;
const { configs: PluginNConfig } = plugin_n;

type PluginPrefixes = 'n/' | '@typescript-eslint/';

type EslintOption = Record<string, boolean | string | Array<unknown>>;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type EslintModifiedRule = Record<string | `${PluginPrefixes}${string}`, [action: 'off' | 'error' | 'warn', ...Array<string | EslintOption>]>;
type DisabledRuleArray = Array<string>;

interface LintGolemOptions {
  rootDir: string;
  ignoreGlobs?: string[];
  tsconfigPaths: string[];
  disableTypeCheckOn?: string[];
  disabledRules?: DisabledRuleArray;
  rules?: EslintModifiedRule;
  useProjectService?: boolean;
  jsx?: boolean;
  ecmaVersion?: 6 | 7 | 8 | 9 | 10 | 11 | 12 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest';

}

export interface Types {
  EslintOption: EslintOption;
  EslintModifiedRule: EslintModifiedRule;
  DisabledRuleArray: DisabledRuleArray;
  LintGolemOptions: LintGolemOptions;
}

export class LintGolem {
  private languageOptionOverrides = {
    ecmaVersion: 'latest' as LintGolemOptions['ecmaVersion'],
    parserOptions: {
      jsx: false,
      allowAutomaticSingleRunInference: true,
      EXPERIMENTAL_useProjectService: false,
    }
  }

  public rootDir: string = process.cwd();
  public ignoreGlobs: string[] = [
    '**/gen',
    '**/*.map.js',
    '**/*.js.map',
    '**/*.mjs.map',
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
    '**/node_modules/**',
    "**/.git/objects/**"
  ];
  public tsconfigPaths: string[] = [];

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
    '@typescript-eslint/no-require-imports', '@typescript-eslint/no-var-requires',
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

  public disabledNodeRules = [
    'n/no-missing-import',
    'n/no-unpublished-require',
    'n/no-unpublished-import',
    'n/no-extraneous-import',
    'n/no-extraneous-require',
  ];
  public nodeModifiedRules: EslintModifiedRule = {}
  public get nodeRules() {
    return {
      ...this.nodeModifiedRules,
      ...this.disabledNodeRules.reduce((acc, rule) => {
        acc[rule] = 'off';
        return acc;
      }, {} as Record<string, string>),
    }
  }

  public disabledEslintRules = ['arrow-body-style', 'camelcase', 'class-methods-use-this', 'consistent-return', 'func-names', 'indent', 'lines-between-class-members', 'no-useless-escape',
    'max-classes-per-file', 'newline-per-chained-call', 'no-bitwise', 'no-console', 'no-inner-declarations', 'no-lonely-if', 'no-nested-ternary', 'no-new', 'no-param-reassign', 'no-plusplus',
    'no-prototype-builtins', 'no-restricted-syntax', 'no-underscore-dangle', 'no-unused-expressions', 'object-shorthand', 'one-var', 'one-var-declaration-per-line', 'spaced-comment'];
  public eslintModifiedRules: EslintModifiedRule = {
    'arrow-parens': [
      'error',
      'as-needed',
      { requireForBlockBody: true },
    ],
    'object-curly-newline': ['error', { multiline: true, consistent: true }],
    'no-shadow': ['error', { hoist: 'never' }],
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
    return ({
      ...this.eslintRules,
      ...this.nodeRules,
      ...this.typescriptRules,
    })
  }

  constructor({ rootDir, disableTypeCheckOn, ignoreGlobs, tsconfigPaths, rules, disabledRules, useProjectService, jsx, ecmaVersion }: LintGolemOptions) {
    try {
      this.languageOptionOverrides.parserOptions.EXPERIMENTAL_useProjectService = useProjectService ?? false;
      this.languageOptionOverrides.parserOptions.jsx = jsx ?? false;
      this.languageOptionOverrides.ecmaVersion = ecmaVersion ?? 'latest';
      this.rootDir = rootDir ?? this.rootDir;
      this.tsconfigPaths = tsconfigPaths;
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
    return ({ ignores: this.ignoreGlobs })
  }

  get disabledFilesObject() {
    return ({ files: this.disableTypeCheckOn, ...tseslint.configs.disableTypeChecked })
  }

  get langOptsObject() {
    const langOpts = {
      ecmaVersion: 'latest' as const,
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        jsDocParsingMode: 'none',
        project: this.tsconfigPaths,
        tsconfigRootDir: this.rootDir,
      }
    } as {
      ecmaVersion: 6 | 7 | 8 | 9 | 10 | 11 | 12 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest';
      parserOptions: {
        jsDocParsingMode: 'none';
        project: string[] | string;
        tsconfigRootDir: string;
        EXPERIMENTAL_useProjectService?: boolean;
        jsx?: boolean;
      }
    }

    if (this.languageOptionOverrides.parserOptions.EXPERIMENTAL_useProjectService) {
      langOpts.parserOptions.EXPERIMENTAL_useProjectService = true;
    }
    if (this.languageOptionOverrides.parserOptions.jsx) langOpts.parserOptions.jsx = true;
    if (this.languageOptionOverrides.ecmaVersion !== 'latest') {
      langOpts.ecmaVersion = this.languageOptionOverrides.ecmaVersion!
    }

    return ({ languageOptions: langOpts })
  }

  get rulesObject() {
    return ({ ...this.langOptsObject, rules: this.rules })
  }

  get config() {
    return ([
      this.ignoresObject,
      eslint.configs.recommended as Record<string, unknown>,
      ...tseslint.configs.recommendedTypeChecked,
      PluginNConfig['flat/recommended-script'],
      prettierConfig,
      this.rulesObject,
      this.disabledFilesObject,
    ] as const);
  }

  protected formatJSONUnbound(json: Record<string, unknown> | Array<string>) {
    return JSON.stringify(json, null, "\t");
  }
  protected formatJSON = (json: Record<string, unknown> | Array<string>) => this.formatJSONUnbound(json);

  protected styles = {
    lintGolemStyle: `background-color: #e636dc; color: #000; padding: 3px 2px; border-radius: 6px; font-weight: bold; font-size: 15px`,
    warningStyle: 'background-color: #ffcc00; color: #000; padding: 1px 2px; border-radius: 4px; font-weight: bold;',
    ruleNameStyle: `background-color: #000; color: #FFF; padding: 1px 2px; border-radius: 5px; font-weight: bold;`
  }

  protected get formatErrorAsString() {
    return `%c LintGolem Warning %c\n %c Rule Disabled AND Modified %c\n  The rule: %c%s%c is set in both your \`rules\` object %s and your \`disabledRules\` array %s`;
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

  public static async init(config: Omit<LintGolemOptions, 'tsconfigPaths'> & { tsconfigPaths?: Array<string> }, verbose = false) {
    try {
      const tsconfigPaths = await glob([
        `tsconfig.json`,
        `*.tsconfig.json`,
        ...(config.tsconfigPaths ?? []),
      ], { cwd: config.rootDir, ignore: config.ignoreGlobs });
      if (tsconfigPaths.length === 0) throw new Error('No tsconfig.json found', { cause: 'Missing projectRoot / glob failure' });
      if (verbose) console.info('Found tsconfigPaths:', tsconfigPaths.join(', \n'));
      return new LintGolem({ ...config, tsconfigPaths });
    } catch (error) {
      console.info('Error:', error);
      throw error;
    }
  }
}
