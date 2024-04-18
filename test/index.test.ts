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
      rules: { 'rule-key': 'rule-value' },
    })

    expect(instance.rootDir).toBe('/root')
    expect(instance.ignoreGlobs.includes('**/ignore')).toBe(true)
    expect(instance.projectRoots.includes('/root/project')).toBe(true)
    expect(instance.disableTypeCheckOn.includes('**/*.js')).toBe(true)
    expect(instance.rules['rule-key']).toBe('rule-value')
  })

  it('ignoresObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'rule-key': 'rule-value' },
    })

    expect(instance.ignoresObject).toEqual({ ignores: instance.ignoreGlobs })
  })

  it('disabledFilesObject returns correct object', () => {
    const instance = new LintGolem({
      rootDir: '/root',
      ignoreGlobs: ['**/ignore'],
      projectRoots: ['/root/project'],
      disableTypeCheckOn: ['**/*.js'],
      rules: { 'rule-key': 'rule-value' },
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
      rules: { 'rule-key': 'rule-value' },
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
      rules: { 'rule-key': 'rule-value' },
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
      rules: { 'rule-key': 'rule-value' },
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
      rules: { 'rule-key': 'rule-value' },
    })

    expect(instance.rootDir).toBe(process.cwd())
  })
})
