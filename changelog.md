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
