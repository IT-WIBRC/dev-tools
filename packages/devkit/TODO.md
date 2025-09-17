## 🚀 scaffolder-toolkit Monorepo - TODO List

This document tracks all planned and completed tasks for the Dev Kit project.

---

### ✅ Completed Tasks

#### Core CLI Commands

- **Refactor `new` command**: Accept language and project name as arguments, with a `--template` option.
- **Implement command management**: Added `add-template`, `list`, and `remove-template` commands.
- **Implement aliases**: Aliases for main commands are now implemented (`dk`, `i`, `ls`).
- **Implement `update` command**: Modify an existing template's properties.
- **Implement verbose option**: A new global `--verbose` option has been added for detailed output.
- **Review arguments vs. commands**: Evaluated and adjusted command structures.

#### Configuration Management

- **Implement `config init`**: Initialize configuration files.
- **Implement `config set`**: Set multiple configuration values at once.
- **Implement `config cache`**: Manage the cache strategy for templates.
- **Establish configuration hierarchy**: Local > global > system language > default.
- **Add JSON schema**: For editor autocompletion and validation.
- **Implement confirmations**: Added confirmation prompts for `config init` and sub-package configurations.
- **Default `config init` behavior**: Now defaults to a local configuration.
- **Add offline autocompletion**: For enhanced user experience.
- **Fix `findGlobalConfig`**: The function has been refactored.
- **Implement `config get`**: Retrieve specific configuration settings.
- **Configuration file change**: Changed local config file from `.devkitrc.json` to `.devkit.json`.

#### Project Infrastructure

- **Set up templates**: Added pull request and issue templates.
- **Implement tests**: Added unit and integration tests (for monorepo, multi-repo, and bare repositories).
- **Automation**: Enhanced GitHub Actions workflows for CI/CD.
- **Error handling**: Improved error logging.
- **Project naming**: The project name in `package.json` is now updated after template import.
- **Publishing**: The repository is now prepared for publication.
- **Package management**: Outdated and corrupted packages have been checked and updated.

#### Internationalization & Documentation

- **Language management**: Changed language JSON to a real JSON structure with inferred types.
- **Dynamic language detection**: The CLI now detects the system's language as a fallback.
- **Document updates**: Documentation has been updated to reflect new features.
- **Tone & content**: The documentation's language has been adjusted for an unpublished project, and the TODO file is up to date.

---

### ⏳ Remaining Tasks

#### Core CLI & Configuration

- [ ] Implement a command to update the CLI itself.
- [x] Adjust autocompletion JSON to provide template-specific autocompletion for properties like `packageManager`.
- [ ] Centralize `chalk` and `ora` in a single file for better code organization.
- [x] Remove constant spinner when running a command and resolving the new command invocation
- [x] Format `config get` display to make it more user friendly
- [ ] Add a global option `-y` or `--yes` to skip confirmation prompts in commands like `dk init`.
- [ ] Add color configuration for templates (evaluate if this is a worthwhile feature).

#### Command Enhancements

- [ ] **New Command Improvements**:
  - [ ] Add interactive prompts for template location input
  - [ ] Add field-by-field input for template configuration
  - [ ] Implement selection menu for supported package managers
  - [ ] Add description field prompt
  - [ ] Add validation for entered values

- [ ] **List Command Improvements**:
  - [ ] Add interactive selection menu for template filtering
  - [ ] Implement "Show All" option in selection
  - [ ] Add scope selection (local/global templates)
  - [ ] Improve template display formatting
  - [ ] Add sorting options for template list

#### Multi-Repo Support

- [x] Implement a clear confirmation message and warning when a local configuration is about to be initialized at the root of a multi-repo project.

#### Language Support

- [x] **Detect Package Manager**: Detect the user's default package manager (e.g., `npm`, `yarn`, `pnpm`) at initialization and set it in the configuration file, as the current default is always `bun`.
- [ ] Test for Deno support.
- [x] Clarify that configurations are currently for Node.js projects and must be placed within the `javascript` template section.
- [ ] **Multi-Programming Language Support**: Progressively add templates for other languages (e.g., Python, Ruby, Go, Rust).

#### Documentation & Versioning

- [x] **Advanced Documentation**: Create detailed guides on creating and managing custom templates.
- [x] Fix the publish workflows in GitHub Actions.
- [x] Investigate and fix the problem with the lint-staged pre-commit hook failing with no reason.
- [x] investigate the workflows to publish the packages, they seem to not work as expected mainly after releasing a new version and does not create a PR with the version bumps to main branch. Also see while after changing the release message on the PR, the commitlint worflow failed to validate the commit message.
- [ ] Add a section in the documentation about the security measures taken to prevent supply chain attacks
- [ ] Update the packages section in the root `package.json` to include all new packages. Change the one corrupted by the npm supply chain attack.
