import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import plugin_n from 'eslint-plugin-n';
import globPkg from 'fast-glob';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import tseslint from 'typescript-eslint';
import { LintGolemError } from './LintGolemError';

const { glob } = globPkg;
const { configs: PluginNConfig }: { configs: any } = plugin_n;

type PluginPrefixes = 'n/' | '@typescript-eslint/';

type EslintOption = Record<string, boolean | string | Array<unknown>>;
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
  // Static constants for default rules
  private static readonly DEFAULT_IGNORE_GLOBS = [
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
  ] as const;

  private static readonly DEFAULT_DISABLE_TYPE_CHECK_ON = [
    '**/*.js',
    '**/*.mjs',
    '**/*.cjs',
  ] as const;

  private static readonly DEFAULT_DISABLED_TYPESCRIPT_RULES = [
    '@typescript-eslint/indent',
    '@typescript-eslint/no-redundant-type-constituents',
    '@typescript-eslint/consistent-type-definitions',
    '@typescript-eslint/explicit-module-boundary-types',
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/ban-ts-comment',
    '@typescript-eslint/no-var-requires',
    '@typescript-eslint/no-unsafe-call',
    '@typescript-eslint/no-unsafe-assignment',
    '@typescript-eslint/no-unsafe-member-access',
    '@typescript-eslint/unbound-method',
    '@typescript-eslint/restrict-template-expressions',
    '@typescript-eslint/no-misused-promises',
    '@typescript-eslint/array-type',
    '@typescript-eslint/no-unnecessary-type-assertion',
    '@typescript-eslint/lines-between-class-members',
    '@typescript-eslint/naming-convention',
    '@typescript-eslint/no-require-imports',
  ] as const;

  private static readonly DEFAULT_TYPESCRIPT_MODIFIED_RULES: EslintModifiedRule = {
    '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: false }],
  };

  private static readonly DEFAULT_DISABLED_NODE_RULES = [
    'n/no-missing-import',
    'n/no-unpublished-require',
    'n/no-unpublished-import',
    'n/no-extraneous-import',
    'n/no-extraneous-require',
  ] as const;

  private static readonly DEFAULT_DISABLED_ESLINT_RULES = [
    'arrow-body-style',
    'camelcase',
    'class-methods-use-this',
    'consistent-return',
    'func-names',
    'indent',
    'lines-between-class-members',
    'no-useless-escape',
    'max-classes-per-file',
    'newline-per-chained-call',
    'no-bitwise',
    'no-console',
    'no-inner-declarations',
    'no-lonely-if',
    'no-nested-ternary',
    'no-new',
    'no-param-reassign',
    'no-plusplus',
    'no-prototype-builtins',
    'no-restricted-syntax',
    'no-underscore-dangle',
    'no-unused-expressions',
    'object-shorthand',
    'one-var',
    'one-var-declaration-per-line',
    'spaced-comment'
  ] as const;

  private static readonly DEFAULT_ESLINT_MODIFIED_RULES: EslintModifiedRule = {
    'arrow-parens': [
      'error',
      'as-needed',
      { requireForBlockBody: true },
    ],
    'object-curly-newline': ['error', { multiline: true, consistent: true }],
    'no-shadow': ['error', { hoist: 'never' }],
  };

  private static readonly VALID_ECMA_VERSIONS = [6, 7, 8, 9, 10, 11, 12, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 'latest'] as const;

  // Instance properties - immutable after construction
  public readonly rootDir: string;
  public readonly ignoreGlobs: readonly string[];
  public readonly tsconfigPaths: readonly string[];
  public readonly disableTypeCheckOn: readonly string[];
  public readonly eslintRules: Record<string, string | [string, ...Array<string | EslintOption>]>;
  public readonly nodeRules: Record<string, string | [string, ...Array<string | EslintOption>]>;
  public readonly typescriptRules: Record<string, string | [string, ...Array<string | EslintOption>]>;
  private readonly languageOptions: {
    ecmaVersion: LintGolemOptions['ecmaVersion'];
    parserOptions: {
      jsx: boolean;
      allowAutomaticSingleRunInference: boolean;
      EXPERIMENTAL_useProjectService: boolean;
    };
  };

  constructor(options: LintGolemOptions) {
    // Validate options
    this.validateOptions(options);

    // Set immutable properties
    this.rootDir = options.rootDir ?? process.cwd();
    this.tsconfigPaths = Object.freeze([...options.tsconfigPaths]);
    this.ignoreGlobs = Object.freeze([
      ...LintGolem.DEFAULT_IGNORE_GLOBS,
      ...(options.ignoreGlobs ?? [])
    ]);
    this.disableTypeCheckOn = Object.freeze([
      ...LintGolem.DEFAULT_DISABLE_TYPE_CHECK_ON,
      ...(options.disableTypeCheckOn ?? [])
    ]);

    this.languageOptions = {
      ecmaVersion: options.ecmaVersion ?? 'latest',
      parserOptions: {
        jsx: options.jsx ?? false,
        allowAutomaticSingleRunInference: true,
        EXPERIMENTAL_useProjectService: options.useProjectService ?? false,
      }
    };

    // Build rules with proper filtering and merging
    this.eslintRules = this.buildRules(
      LintGolem.DEFAULT_DISABLED_ESLINT_RULES,
      LintGolem.DEFAULT_ESLINT_MODIFIED_RULES,
      options.disabledRules,
      options.rules,
      rule => !rule.startsWith('@typescript-eslint/') && !rule.startsWith('n/')
    );

    this.nodeRules = this.buildRules(
      LintGolem.DEFAULT_DISABLED_NODE_RULES,
      {},
      options.disabledRules,
      options.rules,
      rule => rule.startsWith('n/')
    );

    this.typescriptRules = this.buildRules(
      LintGolem.DEFAULT_DISABLED_TYPESCRIPT_RULES,
      LintGolem.DEFAULT_TYPESCRIPT_MODIFIED_RULES,
      options.disabledRules,
      options.rules,
      rule => rule.startsWith('@typescript-eslint/')
    );
  }

  /**
   * Validates constructor options
   */
  private validateOptions(options: LintGolemOptions): void {
    // Validate rootDir
    if (!options.rootDir) {
      throw new LintGolemError('rootDir is required', {
        cause: 'rootDir',
        matchSource: [],
        incomingRule: {}
      });
    }

    const resolvedRootDir = resolve(options.rootDir);
    if (!existsSync(resolvedRootDir)) {
      throw new LintGolemError(`rootDir does not exist: ${resolvedRootDir}`, {
        cause: 'rootDir',
        matchSource: [],
        incomingRule: {}
      });
    }

    if (!statSync(resolvedRootDir).isDirectory()) {
      throw new LintGolemError(`rootDir is not a directory: ${resolvedRootDir}`, {
        cause: 'rootDir',
        matchSource: [],
        incomingRule: {}
      });
    }

    // Validate tsconfigPaths
    if (!options.tsconfigPaths || options.tsconfigPaths.length === 0) {
      throw new LintGolemError('tsconfigPaths is required and must not be empty', {
        cause: 'tsconfigPaths',
        matchSource: [],
        incomingRule: {}
      });
    }

    for (const tsconfigPath of options.tsconfigPaths) {
      const resolvedPath = resolve(options.rootDir, tsconfigPath);
      if (!existsSync(resolvedPath)) {
        throw new LintGolemError(`tsconfig file does not exist: ${resolvedPath}`, {
          cause: 'tsconfigPaths',
          matchSource: options.tsconfigPaths,
          incomingRule: {}
        });
      }
    }

    // Validate ecmaVersion
    if (options.ecmaVersion && !LintGolem.VALID_ECMA_VERSIONS.includes(options.ecmaVersion)) {
      throw new LintGolemError(
        `Invalid ecmaVersion: ${options.ecmaVersion}. Valid values are: ${LintGolem.VALID_ECMA_VERSIONS.join(', ')}`,
        {
          cause: 'ecmaVersion',
          matchSource: [],
          incomingRule: {}
        }
      );
    }

    // Validate conflicting rules
    if (options.rules && options.disabledRules) {
      for (const rule of Object.keys(options.rules)) {
        if (options.disabledRules.includes(rule)) {
          throw new LintGolemError(
            `Rule ${rule} is disabled and modified`,
            {
              cause: rule,
              matchSource: options.disabledRules,
              incomingRule: { [rule]: options.rules[rule] }
            }
          );
        }
      }
    }
  }

  /**
   * Builds a rule set by merging default disabled rules, default modified rules,
   * user disabled rules, and user modified rules
   */
  private buildRules(
    defaultDisabledRules: readonly string[],
    defaultModifiedRules: EslintModifiedRule,
    userDisabledRules: DisabledRuleArray | undefined,
    userModifiedRules: EslintModifiedRule | undefined,
    filter: (rule: string) => boolean
  ): Record<string, string | [string, ...Array<string | EslintOption>]> {
    const rules: Record<string, string | [string, ...Array<string | EslintOption>]> = {};

    // Add default modified rules
    for (const [rule, config] of Object.entries(defaultModifiedRules)) {
      if (filter(rule)) {
        rules[rule] = config;
      }
    }

    // Add user modified rules (filtered to this namespace)
    if (userModifiedRules) {
      for (const [rule, config] of Object.entries(userModifiedRules)) {
        if (filter(rule)) {
          rules[rule] = config;
        }
      }
    }

    // Add default disabled rules
    for (const rule of defaultDisabledRules) {
      if (filter(rule)) {
        rules[rule] = 'off';
      }
    }

    // Add user disabled rules (filtered to this namespace)
    if (userDisabledRules) {
      for (const rule of userDisabledRules) {
        if (filter(rule)) {
          rules[rule] = 'off';
        }
      }
    }

    return rules;
  }

  public get rules() {
    return ({
      ...this.eslintRules,
      ...this.nodeRules,
      ...this.typescriptRules,
    })
  }

  get ignoresObject() {
    return ({ ignores: [...this.ignoreGlobs] })
  }

  get disabledFilesObject() {
    return ({ files: [...this.disableTypeCheckOn], ...tseslint.configs.disableTypeChecked })
  }

  get langOptsObject() {
    const langOpts = {
      ecmaVersion: this.languageOptions.ecmaVersion ?? 'latest' as const,
      parserOptions: {
        allowAutomaticSingleRunInference: true,
        jsDocParsingMode: 'none' as const,
        project: [...this.tsconfigPaths],
        tsconfigRootDir: this.rootDir,
      }
    } as {
      ecmaVersion: 6 | 7 | 8 | 9 | 10 | 11 | 12 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest';
      parserOptions: {
        jsDocParsingMode: 'none';
        project: string[];
        tsconfigRootDir: string;
        EXPERIMENTAL_useProjectService?: boolean;
        jsx?: boolean;
      }
    }

    if (this.languageOptions.parserOptions.EXPERIMENTAL_useProjectService) {
      langOpts.parserOptions.EXPERIMENTAL_useProjectService = true;
    }
    if (this.languageOptions.parserOptions.jsx) {
      langOpts.parserOptions.jsx = true;
    }

    return ({ languageOptions: langOpts })
  }

  get rulesObject() {
    return ({ ...this.langOptsObject, rules: this.rules })
  }

  get config(): readonly [
    { ignores: string[] },
    Record<string, unknown>,
    ...typeof tseslint.configs.recommendedTypeChecked,
    typeof PluginNConfig['flat/recommended-script'],
    typeof prettierConfig,
    { languageOptions: object; rules: Record<string, string | [string, ...Array<string | EslintOption>]> },
    { files: string[] } & typeof tseslint.configs.disableTypeChecked,
  ] {
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

  public static async init(
    config: Omit<LintGolemOptions, 'tsconfigPaths'> & { tsconfigPaths?: Array<string> },
    verbose = false
  ): Promise<LintGolem> {
    try {
      // Validate rootDir first
      if (!config.rootDir) {
        throw new LintGolemError('rootDir is required', {
          cause: 'rootDir',
          matchSource: [],
          incomingRule: {}
        });
      }

      const resolvedRootDir = resolve(config.rootDir);
      if (!existsSync(resolvedRootDir)) {
        throw new LintGolemError(`rootDir does not exist: ${resolvedRootDir}`, {
          cause: 'rootDir',
          matchSource: [],
          incomingRule: {}
        });
      }

      const tsconfigPaths = await glob([
        `tsconfig.json`,
        `*.tsconfig.json`,
        ...(config.tsconfigPaths ?? []),
      ], { cwd: config.rootDir, ignore: config.ignoreGlobs });

      if (tsconfigPaths.length === 0) {
        throw new LintGolemError('No tsconfig.json found', {
          cause: 'tsconfigPaths',
          matchSource: [],
          incomingRule: {}
        });
      }

      if (verbose) {
        console.info('Found tsconfigPaths:', tsconfigPaths.join(', \n'));
      }

      return new LintGolem({ ...config, tsconfigPaths });
    } catch (error) {
      if (error instanceof LintGolemError) {
        throw error;
      }
      throw new LintGolemError(
        `Failed to initialize LintGolem: ${error instanceof Error ? error.message : String(error)}`,
        {
          cause: 'init',
          matchSource: [],
          incomingRule: {}
        }
      );
    }
  }
}
