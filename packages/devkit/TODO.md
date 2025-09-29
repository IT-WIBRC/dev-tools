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
- **Configuration Hierarchy:** The CLI now respects a clear hierarchy: local \> global \> system language \> default.
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

- [ ] **CLI Self-Update**: Implement a command to allow users to update the CLI itself. `dk upgrade`
- [x] `dk info`: A command to display system and environment information that could be useful for debugging issues.
- [x] change the `config` alias from `cf` to `conf`
- [x] **Unified `config` Command**: Complete the refactoring of all configuration-related commands into the new `git`-like pattern under `dk config`. This includes implementing:
  - **Core Operations**: `dk config <key> [value]` for set and get.
  - **Subcommands**: `dk config add`, `dk config update`, and `dk config remove` to manage templates.
  - **Listing**: `dk config --list` with `--all` and `--global` flags.
- [ ] **Enhance `list` Command**: Add support for **different display modes** (e.g., table or tree structure). Also, add options to **filter by property** (e.g., `packageManager`)
- [ ] Add a configuration validation step when initializing or updating the config file to ensure all required fields are present and correctly formatted.
- [ ]: Enhance interactivity with the `dk config add` command
- [ ] **Enhance `list` Command**: Add flag to also see default config `--with-defaults`.
- [ ] ** Enhance for organization Purpose **: Add new language `Typescript` with same code as javascript
- [ ] Add wildcard support for template name in the `dk config update` and `dk config remove` commands.
- [ ] Use the interactive approach for the `dk config add` command (code already there)
- [ ] **Dynamic Error Messages**: Update error handling to dynamically generate lists of valid options (e.g., package managers, cache strategies) in error messages.
- [ ] **Skip Confirmation**: Add a global `-y` or `--yes` option to skip confirmation prompts in commands like `dk init`.
- [ ] **Color Configuration**: Add a feature to allow users to configure the colors for templates.
- [ ] **Dynamic Help Text**: Programmatically generate help text for options with constrained values (e.g., `--cache-strategy`) to ensure it's always up to date.
- [ ] **Testing**: Stabilize the integration test of the `new` command
- [ ] **Centralize Utilities**: Move `chalk` and `ora` to a single, centralized file for better code organization.
- [x] Enable GitHub discussions
- [x] Refactor and restructure the utilities
- [ ] Better json structure for languages

#### Multi-Language Support

- [ ] **Multi-Programming Language Support**: Progressively add support for other languages like Python, Ruby, Go, and Rust.
- [ ] **Deno Support**: Test and confirm support for the Deno runtime.

#### Documentation & Versioning

- [ ] **Security Documentation**: Add a new section to the documentation outlining the security measures taken to prevent supply chain attacks.
- [x] **Package Updates**: Ensure the root `package.json` includes all new packages and that any corrupted packages are replaced.

---

# **New**

## **`dk` Command Patterns**

The CLI follows the `git` model, using a consistent syntax across all commands.

| Command       | Purpose                                          | Syntax                                                 | Scope Options                                               |
| :------------ | :----------------------------------------------- | :----------------------------------------------------- | :---------------------------------------------------------- |
| **`dk new`**  | Creates a new project from a template.           | `dk new <template-name> <project-directory> [options]` | **None** (always local)                                     |
| **`dk init`** | Initializes a project with a configuration file. | `dk init [--global]`                                   | `--global` forces creation of a global config file.         |
| **`dk list`** | Lists available templates.                       | `dk list [--all]`                                      | `--all` lists templates from both local and global configs. |

<br>

---

<br>

## **`dk config` Command Hub**

This command is the central hub for managing all configuration settings and templates. By default, it operates on the **local** scope. Add the **`--global`** flag to target the global configuration file.

### **Core Operations (Set/Get)**

This pattern is for managing direct key-value pairs.

- **Set a single value**: `dk config <key> <value> [--global]`
  - **Example**: `dk config pm bun --global`
- **Get a single value**: `dk config <key> [--global]`
  - **Example**: `dk config pm`
- **Bulk Set**: `dk config set <key1> <value1> <key2> <value2> ...`
- **Bulk Remove**: `dk config remove <key1> <key2> ...`

### **Template Management**

These are specialized subcommands for handling templates.

- **Add**: `dk config add <language> <template-name> [options] [--global]`
- **Update**: `dk config update <language> <template-name> [options] [--global]`
- **Remove**: `dk config remove <language> <template1> <template2> ... [--global]`

### **Listing Configurations**

- **List all configs**: `dk config --list [--all] [--global]`
  - `--list`: Displays the configurations from the current scope.
  - `--all`: Displays both local and global configurations.
  - `--global`: Explicitly displays only the global configurations.
