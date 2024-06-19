import * as eslint from '@eslint/js';
import * as plugin_n from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';
import { describe, it, expect, suite } from 'vitest'
import { LintGolem, type Types } from '../src/index'
import * as prettierConfig from 'eslint-config-prettier';
import { resolve } from 'node:path';

suite('LintGolem', () => {
  const DEFAULTS = {
    rootDir: '/root' as const,
    ignoreGlobs: ['**/ignore'],
    tsconfigPaths: ['/root/project'],
    disableTypeCheckOn: ['**/*.test'],
  }

  const modifiedRuleConfig = {
    rules: {
      'object-curly-newline': [
        'warn',
        { multiline: true, consistent: true },
      ],
      '@typescript-eslint/consistent-indexed-object-style': ['error'],
      'n/no-test': ['error'],
    },
  } as { rules: Types['EslintModifiedRule'] }

  const removedRuleConfig = {
    disabledRules: ['no-new', 'n/no-new', '@typescript-eslint/no-new-daemons'],
  } as Pick<Types['LintGolemOptions'], 'disabledRules'>

  const summon = new LintGolem({ ...DEFAULTS, ...modifiedRuleConfig, ...removedRuleConfig })

  describe('when summoning (constructor)', () => {
    it('should set the default rootDir correctly, even when one is supplied', () => {
      expect(summon.rootDir).toBe(DEFAULTS.rootDir)
    })

    it('should set the default ignoreGlobs correctly, even when one is supplied', () => {
      expect(summon.ignoreGlobs).toEqual([
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
        "**/node_modules/**",
        "**/.git/objects/**",
        '**/ignore',
      ])
    })

    it('should have constructed the ignoresObject from the ignoresGlob', () => {
      expect(summon.ignoresObject).toEqual({ ignores: summon.ignoreGlobs })
    })

    it('should override the defaults when a user supplied tsconfig array is supplied', () => {
      expect(summon.tsconfigPaths).toEqual(DEFAULTS.tsconfigPaths)
    })

    it('should resort to defaults when no tsconfig array is supplied', async () => {
      const noProjectRootSummon = await LintGolem.init({
        rootDir: resolve(__dirname, '..'),
        ignoreGlobs: ['**/ignore'],
        disableTypeCheckOn: ['**/*.js'],
      }, true)
      expect(noProjectRootSummon.tsconfigPaths).toEqual([
        'tsconfig.json',
      ])
    })

    it('should throw an error if no default tsconfig can be found', async () => {
      await expect(async () => LintGolem.init({
        rootDir: __dirname,
        ignoreGlobs: ['*.tsconfig.json', 'tsconfig.json', 'tsconfig.*.json'],
        disableTypeCheckOn: ['**/*.js'],
      }, true)).rejects.toThrowError()

    })

    it('should set the disableTypeCheckOn property correctly', () => {
      expect(summon.disableTypeCheckOn.includes('**/*.test')).toBe(true)
    })

    it('should still have the default disableTypeCheckOn values, even when one is supplied', () => {
      expect(summon.disableTypeCheckOn).toEqual(['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.test'])
    })

    it('should set the disabledFilesObject correctly', () => {
      expect(summon.disabledFilesObject).toEqual({
        files: summon.disableTypeCheckOn,
        ...tseslint.configs.disableTypeChecked,
      })
    })

    it('should create langOptsObject from what the user supplied', () => {
      expect(summon.langOptsObject).toEqual({
        languageOptions: {
          ecmaVersion: 'latest',
          parserOptions: {
            project: summon.tsconfigPaths,
            tsconfigRootDir: summon.rootDir,
          },
        },
      })
    })

    it('should rulesObject returns correct object', () => {
      expect(summon.rulesObject.rules).toEqual(summon.rules)
      expect(summon.rulesObject.languageOptions).toEqual(summon.langOptsObject.languageOptions)
    })

    it('config returns correct array', () => {
      expect(summon.config).toEqual([
        summon.ignoresObject,
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        plugin_n.configs['flat/recommended-script'],
        prettierConfig,
        summon.rulesObject,
        summon.disabledFilesObject,
      ] as const)
    })

    it('should return the process.cwd() as the default rootDir', () => {
      // @ts-expect-error - Testing private property
      const defaultRootSummon = new LintGolem({
        ignoreGlobs: ['**/ignore'],
        tsconfigPaths: ['/root/project'],
        disableTypeCheckOn: ['**/*.js'],
        rules: { 'no-new': ['error'] },
      })

      expect(defaultRootSummon.rootDir).toBe(process.cwd())
    })

    it('should return when rules is not provided', () => {
      const configArray = summon.config
      const rules = configArray[configArray.length - 2]

      const config = { ...rules }

      summon.disableTypeCheckOn = undefined

      expect(rules).toEqual(config)
    })

    it('should allow the user to overwrite rules', () => {
      expect(summon.rules['object-curly-newline']).toEqual(['warn', { multiline: true, consistent: true }])
    })
  })

  describe('when we disable rules', () => {
    removedRuleConfig.disabledRules?.forEach((rule) => {
      const prefix = rule.startsWith('@typescript-eslint') ? '@typescript-eslint' : rule.startsWith('n/') ? 'n/' : 'eslint'

      it(`should have disabled the ${rule} rule`, () => {
        if (prefix === 'eslint') {
          expect(summon.disabledEslintRules.includes(rule)).toBe(true)
        } else if (prefix === 'n/') {
          expect(summon.disabledNodeRules.includes(rule)).toBe(true)
        } else {
          expect(summon.disabledTypescriptRules.includes(rule)).toBe(true)
        }
      })

      it(`should have removed the ${rule} rule from the rules object`, () => {
        expect(summon.rules[rule]).toEqual('off')
      })
    })
  })

  suite('when we modify and disable a', () => {
    describe('eslint rule', () => {
      it('should throw an error', () => {
        expect(() => {
          const lintRules = new LintGolem({
            ...DEFAULTS,
            rules: {
              'no-constant-condition': ['error'],
            },
            disabledRules: ['no-constant-condition'],
          })

          return lintRules.rules

        }).toThrowError('Rule no-constant-condition is disabled and modified')
      })
    })

    describe('typescript-eslint rule', () => {
      it('should throw an error', () => {
        expect(() => {
          const lintRules = new LintGolem({
            ...DEFAULTS,
            rules: {
              '@typescript-eslint/no-new-symbol': ['error'],
            },
            disabledRules: ['@typescript-eslint/no-new-symbol'],
          })

          return lintRules.rules

        }).toThrowError('Rule @typescript-eslint/no-new-symbol is disabled and modified')
      })
    })

    describe('node rule', () => {
      it('should throw an error', () => {
        expect(() => {
          const lintRules = new LintGolem({
            ...DEFAULTS,
            rules: {
              'n/no-new': ['error'],
            },
            disabledRules: ['n/no-new'],
          })

          return lintRules.rules

        }).toThrowError('Rule n/no-new is disabled and modified')
      })
    })
  })
})
