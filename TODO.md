# 🚀 Dev Kit Monorepo - TODO List

This document tracks all planned tasks, bugs, and future ideas for the Dev Kit project.

## Core Development

- [ ] Update this TODO with all what has been done so far
- [ ] Add template for all known Node.js templates
- [ ] Use a better login method for errors
- [x] Add pull request template and issue templates
- [x] change the project name inside the package.json file after importing template content
- [ ] Don't forget to test all of these changes
- [ ] Use changesets for changelog and versioning, and automate the process
- [ ] (Maybe) Support environment variables
- [x] Check what can be changed into an argument instead of a command
- [x] Support template creation using a command
- [ ] Update `$schema` to use to allow autocompletion in editors
- [x] Detect system language dynamically
- [x] Support Monorepo configuration
- [x] Configure aliases
- [ ] Find a way to test the templates
- [x] Refactor the `new` command to accept option to select a template
- [x] Warn user to not use already used names for templates and tell we only support js templates containing nodejs related templates (No need anymore as user can create custom templates or edit existing ones)
- [ ] Add a command to list all available templates
- [ ] Add a command to remove a template
- [ ] Add a command to update a template
- [ ] Add a command to update the CLI itself
- [ ] Add a command to update the templates
- [ ] Add a command to update the configuration
- [ ] Add a command to update the language configuration
- [ ] Add integration tests in addition to unit tests (reproduce monorepo, multi repo and bare repository)
- [x] Enable copilot reviews for the project on GitHub (Impossible as it's not free as expected)

## Internationalization & Documentation

- [x] Change language JSON to a real JSON structure and find a way to infer types when using `t`. Adjust the code to read it.
- [ ] **Multi-Programming Language Support**: Progressively add templates for various frameworks and ecosystems (e.g., Python, Ruby, Go, Rust).
- [ ] **Advanced Documentation**: Detailed guides on creating and managing custom templates, with examples for various frameworks.
