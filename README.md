# 🚀 (@itwibrc/devkit) Dev Kit (`dk`)

A universal CLI for professional developers to automate project scaffolding and streamline workflows.

**Dev Kit** (`dk`) is a powerful command-line tool designed to boost your productivity by automating repetitive tasks. Whether you're setting up a new machine or starting a new project, `dk` is your essential solution for project automation.

Built to fit the modern developer workflow, `dk` seamlessly integrates into monorepos and supports a wide range of features to help you start coding faster.

---

## ✨ Key Features

- **Unified Command:** Access all features with the short, intuitive command `dk`.
- **Intelligent Scaffolding:** Create new projects from popular frameworks with a single, intuitive command. You can also use custom templates for a consistent workflow.
- **Robust Configuration:** The tool reliably finds your configuration file (`.devkitrc`) in any project or monorepo structure.
- **Powerful Cache Management:** Optimize project setup speed with flexible caching strategies for your templates. These strategies are mainly applied when using a GitHub URL:
  - `always-refresh`: Always pull the latest template from the remote repository.
  - `never-refresh`: Use the local cached template without checking for updates.
  - `daily` (default): Refresh the cache only once every 24 hours.
- **Seamless Internationalization (i18n):** The CLI supports multiple languages, with all commands and descriptions dynamically translated. It **automatically detects your system's language** as a fallback, ensuring a seamless out-of-the-box experience.
- **Centralized Settings:** Manage your preferred package manager (npm, yarn, pnpm, bun, deno) and cache strategy with a single command.

---

## 📂 Use Cases

The Dev Kit CLI streamlines development workflows in various environments:

- **Globally Installed CLI:** Install `dk` globally for a universal scaffolding tool on your machine.
- **Monorepo:** A single configuration file at the root can manage settings and templates for all projects, ensuring consistency across your entire codebase.
- **Multiple Repositories:** Each project can have its own `.devkitrc` file for unique settings, allowing for flexible project management.

---

## 🗺️ Supported Languages

The CLI's internationalization (`i18n`) feature dynamically translates commands and descriptions. Currently, the following languages are supported:

- English (`en`)
- French (`fr`)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js (v18 or higher)** and a package manager installed.

### Installation

Install Dev Kit globally using your preferred package manager.

```bash
# using bun
bun install -g devkit

# using npm
npm install -g devkit

# using pnpm
pnpm install -g devkit

# using yarn
yarn global add devkit
```

### Verify Installation

To confirm everything is working, run the help command.

```bash
dk --help
```

---

## ⚙️ Usage

Here's how to get started with the Dev Kit CLI.

### Create a new project from a template

```bash
# Create a new Vue project from a custom template
dk new vue my-awesome-app
```

### Manage your CLI configuration

Use the `config set` command to update your `.devkitrc` file.

```bash
# Set your default package manager to pnpm
dk config set pm pnpm

# Set the language to French
dk config set language fr
```

### Manage cache strategy for a template

Use the `config cache` command to update the cache strategy for a specific template.

```bash
# Set the cache strategy for the 'react' template to 'always-refresh'
dk config cache react always-refresh
```

### Shortcuts

For a faster workflow, the following commands have shortcuts:

- `devkit` -\> `dk`
- `init` -\> `i`
- `config` -\> `cf`
- `cache` -\> `c`

---

## ⚙️ Configuration

Manage your configuration either through the CLI or by manual editing.

### Configuration Hierarchy

Dev Kit now loads settings with a clear priority to give you maximum control and flexibility.

1.  **Local Project Configuration (`./.devkitrc`)**: This file, at the root of your project, takes the **highest priority**.
2.  **Global Configuration (`~/.devkitrc`)**: This file, stored in your user's home directory, is used for all projects on your machine and is overridden by any local configuration.
3.  **System Language Detection**: If a language setting is not found in either the local or global configuration, `dk` will **automatically detect your system's language** and load the corresponding translations.
4.  **Default**: If none of the above are found, the language will default to English (`en`).

### Create and configure a project file

To initialize a local configuration file in your project, use `config init`. This creates a `.devkitrc` file in the current directory.

```bash
dk config init
```

### Add the JSON Schema for Autocompletion

For a better developer experience, add a `$schema` property for auto-completion and validation in editors like VS Code.

```json
{
  "$schema": "https://raw.githubusercontent.com/IT-WIBRC/devkit/main/schema.json",
  "settings": {
    "language": "fr",
    "defaultPackageManager": "npm",
    "cacheStrategy": "daily"
  },
  "templates": {
    "react": {
      "templates": {
        "ts": {
          "location": "https://github.com/IT-WIBRC/react-ts-template"
        }
      }
    }
  }
}
```

### Template Configuration

Dev Kit provides a set of default templates and we'll progressively add more. The `location` property for a custom template can be a local folder, a GitHub URL, or a command. Note that cache strategies are only applied when using a GitHub URL.

You can also define an **`alias`** to make it easier to reference a specific template. An alias is a simple shortcut for a template's name.

```json
{
  "templates": {
    "my-app": {
      "templates": {
        "my-local-template": {
          "description": "A template from my local machine",
          "location": "/Users/myuser/projects/my-local-template"
        },
        "from-github": {
          "description": "A template from a GitHub repository",
          "location": "https://github.com/my-user/my-template-repo",
          "alias": "gh-template"
        },
        "from-create-command": {
          "description": "Uses the native `create` command",
          "location": "{pm} create nuxt@latest"
        }
      }
    }
  }
}
```

### Using a custom template with an alias

Once an alias is configured, you can use it in place of the full template name for faster commands.

```bash
# Create a new project using the alias 'gh-template'
dk new my-app gh-template my-new-project-name
```

---

## 🗺️ Roadmap & Future Features

This project is in its early stages. We're committed to building a comprehensive developer toolkit.

- **Multi-Programming Language Support:** We'll progressively add templates for various frameworks and ecosystems (e.g., Python, Ruby, Go, Rust).
- **Advanced Documentation:** Detailed guides on creating and managing custom templates, with examples for various frameworks.

---

## 🤝 Contributing

We welcome contributions\! If you have a feature idea, find a bug, or want to contribute code, please open an issue or a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a pull request.

---

## 📄 License

MIT

Copyright (c) 2025, WAFFEU Ivany Botrel Rayn
Contact
Ivany Botrel Rayn WAFFEU - wibrc.se.jc@gmail.com
