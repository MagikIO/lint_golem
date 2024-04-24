import eslint from '@eslint/js';
import plugin_n from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';
import { describe, it, expect } from 'vitest'
import { LintGolem } from '../src/index.ts'

describe('LintGolem', () => {
  it('constructor sets properties correctly', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.rootDir).toBe('/root')
    expect(instance.ignoreGlobs.includes('**/ignore')).toBe(true)
    expect(instance.projectRoots.includes('/root/project')).toBe(true)
    expect(instance.disableTypeCheckOn.includes('**/*.js')).toBe(true)
    expect(instance.rules['no-new']).toEqual(['error'])
  })

  it('ignoresObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.ignoresObject).toEqual({ ignores: instance.ignoreGlobs })
  })

  it('disabledFilesObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.disabledFilesObject).toEqual({
      files: instance.disableTypeCheckOn,
      ...tseslint.configs.disableTypeChecked,
    })
  })

  it('langOptsObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.langOptsObject).toEqual({
      languageOptions: {
        ecmaVersion: 'latest',
        parserOptions: {
          project: instance.projectRoots,
          tsconfigRootDir: instance.rootDir,
        },
      },
    })
  })

  it('rulesObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.rulesObject).toEqual({
      ...instance.langOptsObject,
      rules: instance.rules,
    })
  })

  it('config returns correct array', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.config).toEqual([
      instance.ignoresObject,
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      plugin_n.configs['flat/recommended-script'],
      instance.rulesObject,
      instance.disabledFilesObject,
    ])
  })

  it('should return the process.cwd() as the default rootDir', () => {
    // @ts-expect-error
    const instance = new LintGolem({
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'no-new': ['error'] },
    })

    expect(instance.rootDir).toBe(process.cwd())
  })

  it('should allow us to disable rule', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      disabledRules: ['no-new'],
    })

    it('should have add the rule to disabledEslintRules', () => {
      expect(instance.disabledEslintRules.includes('no-new')).toBe(true)
    })

    it('should have have the rules as disabled in the final rules', () => {
      expect(instance.config[4]['no-new']).toEqual(['off'])
    })
  })
})
