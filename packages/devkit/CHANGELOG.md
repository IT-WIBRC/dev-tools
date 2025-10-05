# scaffolder-toolkit

## 2.0.0

### Major Changes

- fb453cd: feat: Centralize configuration management under new 'dk config' command and enhance 'dk list'

### Minor Changes

- 6a4efa2: feat(config): Implement schema validation when loading configuration
- 71930e4: feat: Introduces the new `dk info` command (alias `dk in`) to display comprehensive diagnostic information about the CLI environment. This command reports the CLI version, runtime details (Node.js/Bun), OS, and the existence and location of both global (`~/.devkitrc`) and local (`.devkit.json`) configuration files.
- 3407be6: feat(.github): configure GitHub Discussions for community feedback
- a8a222e: feat(config): Add --yes/-y option to dk init for non-interactive overwrite
- 9dc5384: feat(cli): Improve `add-template` command with interactive flow. Add validation to the `add-template` command to check if a repository or local path exists before saving the template to the configuration.
- e0862aa: feat(option): update 'dk list' filtering to '--where' with new advanced syntax
- c5260ed: feat: refactoring configuration command logic into dedicated, reusable files and adding comprehensive unit tests for init, remove, and update commands, including new wildcard (\*) template resolution.
- 962819a: feat: Add --include-defaults to list commands; enhance template config with {pm} token
- ef9dea7: feat(cli): Add support for language aliases (js, ts, n) in all relevant commands
- 8f1a5a4: feat: Add --mode option to `dk list` and strengthen logger table
- 759300a: feat(list): enhance list command with filter option and improved output

### Patch Changes

- fc5d1d0: refactor: restructure json translation for better organization
- f63786d: fix(scaffolding): Remove partially created project directory on failure
- d0f0683: fix(config): Update config command alias from 'cf' to 'conf'
- dedc1cf: refactor(utils): Complete utility reorganization and introduce core abstractions
- 4e86dee: refactor(cli): implement dynamic help text generation
- 0e259c3: feat: Add short aliases (pm, lang, cache) for configuration keys
- b05f20a: refactor: Move `chalk` and `ora` to a single, centralized file for better code organization.

## 1.0.11

### Patch Changes

- e3abeb4: - Remove constant spinner when running a command and resolving the new command invocation
  - investigate the workflows to publish the packages, they seem to not work as expected mainly after releasing a new version and does not create a PR with the version bumps to main branch. Also see while after changing the release message on the PR, the commit lint workflow failed to validate the commit message.

## 1.0.10

### Patch Changes

- e0fea6f: Revise and change the publish worflow by combining both jobs in one to avoid delay

## 1.0.9

### Patch Changes

- 2a669b3: fix publish workflow
- 7e45a47: ci: adjust release-pr workflow for dynamic messaging

## 1.0.8

### Patch Changes

- b7ce351: Format `config get` display to make it more user friendly
- 41583f9: fix: manage config initialization on multi repository
- 93cb5bd: Add the verbose option for detailed output
- 19f7295: Add support for the offline autocompletion configuration
- e187d77: ci: add automated release and branch deletion workflows

## 1.0.7

### Patch Changes

- 4f5cabc: chore: expose the package locales folder

## 1.0.6

### Patch Changes

- edaff67: chore: fix missing locales on build

## 1.0.5

### Patch Changes

- 2c741c5: ### Summary of Changes

  This release addresses a critical build issue by migrating the project's build system from `esbuild` to **Rollup**. This change resolves the `Dynamic require` bug for CommonJS dependencies, ensuring the CLI builds and runs correctly in a Node.js environment.

  ***

  ### Key Changes:
  - **Build Pipeline Migration:** Replaced the `esbuild` build process with a **Rollup** configuration to correctly handle CJS dependencies.
  - **CommonJS Compatibility:** Integrated and configured `@rollup/plugin-commonjs` to resolve `require` calls in third-party libraries.
  - **External Dependencies:** Explicitly marked Node.js built-in modules (`fs`, `path`, etc.) and project dependencies as `external` in the Rollup config, preventing them from being bundled. This is a best practice for Node.js CLI tools.
  - **JSON Handling:** Added `@rollup/plugin-json` to the build process to correctly import `.json` files from dependencies.
  - **Build Artifacts:** Adjusted the configuration to prevent the generation of sourcemap files.
  - **Test Suite Reliability:** Updated integration tests to be more resilient to inconsistent CLI output, using regular expressions and whitespace normalization to ensure reliable assertions.
  - **Documentation:** Updated the `README.md` to reflect the new global installation advice and correct minor Markdown formatting issues.

## 1.0.4

### Patch Changes

- f1b3fe8: Adjust build process to make it more light

## 1.0.3

### Patch Changes

- 12cd2ce: Change build to bundling to support environment

## 1.0.2

### Patch Changes

- f7109f0: Add build (dist) result to the npm published package
- 54d6400: Fix the documentation error and naming

## 1.0.1

### Patch Changes

- d4b82df: Fix the documentation error and naming

## 1.0.0

### Major Changes

- 215e20f: ### **Summary of Changes for Version 1.0.0**

  This release marks a significant milestone for the project, transitioning it from a standalone CLI to a multi-tool **monorepo**. This update focuses entirely on the project's internal architecture, laying a stable and scalable foundation for all future developer tools.

  #### **Key Highlights:**
  - **Monorepo Migration**: The project has been restructured to use Bun Workspaces, allowing for the co-development of multiple tools within a single repository.
  - **Unified Build System**: The build process is now managed from the monorepo root, enabling a single command to build all present and future tools in the correct dependency order.
  - **Streamlined Documentation**: The repository now has a centralized `README.md` at the root, which acts as a directory for all individual tool documentation.
  - **Dependency Management**: All dependencies are now centrally hoisted to the monorepo root, ensuring a more efficient and consistent development environment.
