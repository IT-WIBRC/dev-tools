## 🚀 scaffolder-toolkit - TODO List

This document tracks all planned and completed tasks for the Dev Kit project.

---

### ✅ Completed Tasks

#### Core CLI & Configuration

- **Improved `add-template` Command:** Added an interactive, guided flow that uses command-line options to pre-fill prompts. This enhancement is now marked as complete.
- **Enhanced `list` Command:** The command now includes a filter option and has improved output for better readability.
- **Auto-Detect Package Manager:** The CLI now automatically detects the user's default package manager at initialization and saves it to the configuration file.
- **Refactor `new` Command:** The command now accepts language and project name as arguments with a `--template` option.
- **Command Management:** Implemented `add-template`, `list`, and `remove-template` commands.
- **Aliases:** All aliases for main commands (`dk`, `i`, `ls`, etc.) have been implemented.
- **`update` Command:** The `update` command now allows modifying existing template properties.
- **Verbose Option:** A global `--verbose` option has been added for detailed output.
- **`config init`:** The `init` command now defaults to initializing a local configuration.
- **`config set`:** The command can now set multiple configuration values at once.
- **`config cache`:** Implemented a dedicated command to manage a template's cache strategy.
- **Configuration Hierarchy:** The CLI now respects a clear hierarchy: local > global > system language > default.
- **JSON Schema:** A JSON schema has been added for editor autocompletion and validation.
- **Offline Autocompletion:** The CLI supports offline autocompletion.
- **`config get`:** The command can retrieve specific configuration settings.
- **Formatting:** The display for `config get` has been formatted for better readability.
- **Removed Spinner:** The constant spinner when running commands has been removed.
- **Configuration File Name:** The local config file name has been changed from `.devkitrc.json` to `.devkit.json`.

#### Project Infrastructure & Quality of Life

- **Templates:** Pull request and issue templates have been set up.
- **Testing:** Unit and integration tests are in place for various repository types.
- **CI/CD:** GitHub Actions workflows for CI/CD have been enhanced.
- **Error Handling:** Error logging has been improved.
- **Project Naming:** The project name in `package.json` is updated after template import.
- **Publishing:** The repository is prepared for publication.
- **Package Management:** Outdated and corrupted packages have been checked and updated.
- **Multi-Repo Support:** A clear confirmation and warning message is now displayed when a local configuration is about to be initialized in a multi-repo project.
- **Language Clarification:** The documentation clarifies that configurations are currently for Node.js projects and must be in the `javascript` section.
- **Documentation:** The documentation has been updated to reflect the new features and tone.
- **Workflow:** Issues with publishing workflows have been investigated and fixed.

---

### ⏳ Remaining Tasks

#### Core CLI & Configuration

- [ ] **CLI Self-Update**: Implement a command to allow users to update the CLI itself.
- [ ] **Unified `config` Command**: Refactor `config set` and `config get` into a single, interactive command that guides the user through modifying all configuration settings.
- [x] **Template Validation**: Add validation to the `add-template` command to check if a repository or local path exists before saving the template to the configuration.
- [ ] **Dynamic Error Messages**: Update error handling to dynamically generate lists of valid options (e.g., package managers, cache strategies) in error messages.
- [ ] **Centralize Utilities**: Move `chalk` and `ora` to a single, centralized file for better code organization.
- [ ] **Skip Confirmation**: Add a global `-y` or `--yes` option to skip confirmation prompts in commands like `dk init`.
- [ ] **Color Configuration**: Add a feature to allow users to configure the colors for templates.
- [ ] **Language Abstraction**: Investigate how to infer a template's language from its contents, removing the need for explicit language sections in the configuration.
- [ ] **Dynamic Help Text**: Programmatically generate help text for options with constrained values (e.g., `--cache-strategy`) to ensure it's always up to date.
- [ ] **Testing**: Stabilize the integration test of the `new` command

#### Multi-Language Support

- [ ] **Multi-Programming Language Support**: Progressively add support for other languages like Python, Ruby, Go, and Rust.
- [ ] **Deno Support**: Test and confirm support for the Deno runtime.

#### Documentation & Versioning

- [ ] **Security Documentation**: Add a new section to the documentation outlining the security measures taken to prevent supply chain attacks.
- [ ] **Package Updates**: Ensure the root `package.json` includes all new packages and that any corrupted packages are replaced.
