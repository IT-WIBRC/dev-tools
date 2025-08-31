## 🚀 Dev Kit Monorepo - TODO List

This document tracks all planned and completed tasks for the Dev Kit project.

---

### Core CLI Commands

- [x] **Familiarize myself with CLI concepts and core functionalities.**
- [x] Refactor the `new` command to accept a language and project name as arguments, with a `--template` option.
- [x] Add the `add-template` command to support adding a new template to the configuration.
- [x] Add the `list` command to list all available templates in the configuration.
- [x] Add the `remove-template` command to remove a template from the configuration.
- [x] Add the `update` command to modify an existing template's properties.
- [x] Implement aliases for main commands (e.g., `dk` for `devkit`, `i` for `init`, `ls` for `list`).

---

### Configuration Management

- [x] Implement `config init` to initialize a configuration file.
- [x] Implement the `config set` command to set one or more configuration values at once.
- [x] Implement the `config cache` command to manage the cache strategy for templates.
- [x] Implement a clear configuration hierarchy (local > global > system language > default).
- [x] Add a JSON schema to the configuration file for editor autocompletion and validation.
- [x] Ask for confirmation before initializing when a config file is already present.
- [x] Make `config init` default to a local configuration if no flag is passed.
- [x] Enable monorepo support by correctly identifying the local configuration file.

---

### Project Infrastructure

- [x] Add pull request and issue templates.
- [x] Set up unit tests for the CLI.
- [x] Change the project name inside `package.json` after importing a template.
- [x] Check what can be changed into an argument instead of a command.
- [x] Implement a better login method for errors.
- [x] Update this TODO with all that has been done so far.

---

### Internationalization & Documentation

- [x] Change language JSON to a real JSON structure and infer types for translation.
- [x] Dynamically detect the system's language as a fallback.
- [x] Update the documentation with the new features, including the `init` command's confirmation prompt.
- [x] Use appropriate language for an unpublished document.
- [x] Adjust the TODO file to reflect completed tasks.

---

### Remaining Tasks

- [x] Add integration tests (reproduce monorepo, multi-repo, and bare repositories).
- [x] change config file for local project from `.devkitrc.json` to `.devkit.json`
- [ ] Add commands to get settings (e.g., `config get <key>`).
- [ ] Add templates for popular Node.js frameworks (e.g., Express, Next.js, NestJS).
- [ ] Use Changesets for changelog and versioning.
- [ ] **Multi-Programming Language Support**: Progressively add templates for other languages (e.g., Python, Ruby, Go, Rust).
- [ ] **Advanced Documentation**: Create detailed guides on creating and managing custom templates.
- [ ] (Maybe) Support environment variables.
- [ ] (Maybe) Add a command to update the CLI itself.
