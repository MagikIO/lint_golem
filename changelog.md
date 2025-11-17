## V3.5.0

### Improvements
- Fixed critical build failure by adding explicit return type to `config` getter (src/index.ts:228)
- Fixed type annotation for `PluginNConfig` to ensure portable type definitions
- Fixed type error in eslint.config.js (tsconfigPaths now correctly accepts array)
- Added `lint` and `typecheck` scripts to package.json for better developer experience

### CI/CD Enhancements
- Added build verification workflow to catch build errors in PRs
- Added ESLint check workflow to enforce code quality
- Added TypeScript type-checking workflow to catch type errors
- Fixed duplicate pnpm installation in test workflow (removed redundant step)

### Testing
- Maintained 97%+ code coverage across all changes
- All 24 tests passing

---

## V1.1.1

- Created the changelog.md file
- Added a test suite for the library
- Added github actions to test incoming PRs
- Activated linting within this library using it's own configuration
- Added a new rule to the default configuration
  > ```json
  > "n/no-unpublished-import": ["error", {
  >   "ignoreTypeImport": true, "allowModules": ["vite"],
  >  }],
  > ```
