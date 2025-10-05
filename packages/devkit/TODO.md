## 🚀 scaffolder-toolkit - TODO List

This document tracks all planned and completed tasks for the Dev Kit project.

---

### ✅ Completed Tasks

#### Core CLI & Configuration

- **Improved `add-template` Command:** Added an interactive, guided flow that uses command-line options to pre-fill prompts. This enhancement is now marked as complete. (Deactivate for now to focus on the automate part)
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
- **JSON Schema:** A JSON schema has been added for editor autocompletion and validation, including **`typescript`** and **`nodejs`** keys.
- **Offline Autocompletion:** The CLI supports offline autocompletion.
- **`config get`:** The command can retrieve specific configuration settings.
- **Formatting:** The display for `config get` has been formatted for better readability.
- **Removed Spinner:** The constant spinner when running commands has been removed.
- **Configuration File Name:** The local config file name has been changed from `.devkitrc.json` to `.devkit.json`.
- **`dk info`:** A command to display system and environment information useful for debugging issues.
- **Configuration Alias:** Changed the `config` alias from `cf` to `conf`.
- **Unified `config` Command:** Refactored all configuration-related commands into the new `git`-like pattern under `dk config`, including `set`, `get`, `add`, `update`, `remove`, and `list` subcommands.
- **Centralize Utilities:** Moved `chalk` and `ora` to a single, centralized file for better code organization.
- **Dynamic Help Text:** Programmatically generated help text for options with constrained values (e.g., `--cache-strategy`) to ensure it's always up to date.
- **Enhance `list` Command:** Added support for **different display modes** (`table` or `tree` structure, with `tree` as default) and options to **filter by properties** (`--where`). Also added flag to see default config (`--include-defaults`).
- **Language Keys:** Added support for `typescript` (`ts`) and `nodejs` (`node`) language keys, with identical logic to `javascript` (`js`), for better organization.
- **Config Key Shortcuts:** Added short keys to get config using `dk config` (e.g., `dk config lang` for `dk config language`).
- **Documentation:** Explained the usage of the **`{pm}`** placeholder inside the configuration documentation.
- **Configuration Validation:** Added a configuration validation step when updating the config file to ensure all required fields are present and correctly formatted.
- **Skip Confirmation Flag:** Added a global **`-y`/`--yes`** option to skip confirmation prompts in commands like `dk init`.
- **Wildcard Support:** Added wildcard support (`*`) for template name in the `dk config update` and `dk config remove` commands.
- **Settings List:** Added a `--settings, -s` to the `dk list` command to display only the current configuration settings.
- **Centralize Help & Options:** Review all commands to ensure options and their descriptions are generated from a single, centralized source.

#### Project Infrastructure & Quality of Life

- **Templates:** Pull request and issue templates have been set up.
- **Testing:** Unit and integration tests are in place for various repository types.
- **CI/CD:** GitHub Actions workflows for CI/CD have been enhanced.
- **Error Handling:** Error logging has been improved.
- **Project Naming:** The project name in `package.json` is updated after template import.
- **Publishing:** The repository is prepared for publication.
- **Package Management:** Outdated and corrupted packages have been checked and updated.
- **Package Updates:** Ensured the root `package.json` includes all new packages and that any corrupted packages are replaced.
- **Multi-Repo Support:** A clear confirmation and warning message is now displayed when a local configuration is about to be initialized in a multi-repo project.
- **Language Clarification:** The documentation clarifies that configurations are currently for Node.js projects and must be in the `javascript` section.
- **Documentation:** The documentation has been updated to reflect the new features and tone.
- **Workflow:** Issues with publishing workflows have been investigated and fixed.
- **Testing Stabilization:** Stabilized the integration test of the `new` command.
- **Cleanup:** Ensured that the `dk new` command cleans up if the process fails.
- **Discussions:** Enabled GitHub discussions.
- **Utilities Refactoring:** Refactored and restructured the utilities.
- **Translation Structure:** Implemented a better JSON structure for language translation.

---

### ⏳ Remaining Tasks

#### Priority 1: Core Automation, Cache Management, and Cleanup (Execution Focus)

- [ ] **Command: Validate Config:** Implement a dedicated command, **`dk config validate`**, to manually run the JSON schema and integrity checks on the active configuration files.
- [ ] **Config: Cache Path Setting & Logic:** Implement the **`cachePath`** setting with the short key **`cpath`**. Ensure it is configured during `dk init`, displayed via `dk list --settings` and `dk info`, and validated for existence/locality on `dk config set`. Update `dk new` and cloning logic to use this path for template discovery and persistence.
- [ ] **Config: Numeric Cache Time:** Update configuration to allow **`cacheStrategy`** to be defined using a **number in seconds** (e.g., `3600`).
- [ ] **Logic: Cache Time Parsing:** Update the core logic to correctly parse and apply the new numeric `cacheStrategy` value.
- [ ] **Logic: Skip Clone on Daily Cache Hit:** Ensure that when a template uses the `daily` cache strategy and the local cache is current, the CLI skips the remote repository **cloning/fetching** operation entirely.
- [ ] **Command: List Cache:** Implement **`dk cache list`** to display all currently cached templates.
- [ ] **Command: Delete Specific Cache:** Implement **`dk cache delete <template-name>`** to remove a single template's cache.
- [ ] **Command: Clear All Cache:** Implement **`dk cache clear`** to delete _all_ cached files (respecting the global `-y` flag).
- [ ] **Config: Property Removal (Null Logic):** Implement logic for **`dk config update`** where `null` removes a property. **Crucially, throw an error** if attempting to set a required property to `null`.
- [ ] **Bulk File Operations (YAML/JSON):** Add the possibility to pass a **YAML or JSON file** containing a list of operations to enable bulk configuration management (`dk config add/update/remove`) and **bulk project scaffolding** (`dk new`).
- [ ] **Cleanup: Deprecate `config list`:** Remove the dedicated **`dk config list`** command.

---

#### Priority 2: Interactivity (Usability Features)

- [ ] **Interactivity: Project Creation:** Implement interactive mode (prompts) for **`dk new`** when required arguments are missing.
- [ ] **Interactivity: Template Management:** Implement interactive mode (prompts) for **`dk config add`**, **`dk config update`**, and **`dk config remove`** when run without necessary arguments.

---

#### Priority 3: Multi-Language Support

- [ ] **Multi-Programming Language Support:** Progressively add support for other languages like Python, Ruby, Go, and Rust.
- [ ] **Deno Support:** Test and confirm support for the Deno runtime ecosystem and package management capabilities.

---

### Debating (RD)

- [ ] **Unsupported Languages Policy:** Decide and implement the policy for unsupported languages: allow configuration with a warning, and for **`dk new`**, copy the template as-is without installing dependencies or modifying content (ignoring `.git`).
- [ ] **CLI Self-Update:** Implement a command to allow users to update the CLI itself via the tool.
- [ ] **Color Configuration:** Add a feature to allow users to configure the colors used for template output and CLI formatting.
- [ ] Cross platform project support
