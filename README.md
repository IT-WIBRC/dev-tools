# 🚀 Dev Kit (`dk`)

### A universal CLI for professional developers to automate project scaffolding and streamline workflows.

**Dev Kit** (`dk`) is a powerful **command-line tool** designed to boost your productivity by automating repetitive **developer tasks**. Whether you're setting up a new machine or starting a new project, `dk` is your essential solution for **project automation**.

Built with modern **developer workflow** in mind, `dk` seamlessly integrates into monorepos and supports a wide range of features to get you coding faster.

---

### ✨ Key Features

- **Unified Command**: Access all features with the short command **`dk`**.
- **Intelligent Scaffolding**: Create new projects from popular **frameworks** with a single, intuitive command. Use custom templates for a consistent workflow.
- **Robust Configuration**: The tool reliably finds your configuration file (`.devkitrc`) in any project or **monorepo** structure.
- **Powerful Cache Management**: Optimize **project setup speed** with flexible caching strategies for your templates. These strategies are mainly applied when using a **GitHub URL**:
  - `always-refresh`: Always pull the latest template from the remote repository.
  - `never-refresh`: Use the local cached template without checking for updates.
  - `daily` (default): Refresh the cache only once every 24 hours.
- **Seamless Internationalization (i18n)**: The CLI supports multiple languages, with all commands dynamically translated based on your configuration.
- **Centralized Settings**: Manage your preferred **package manager** (`npm`, `yarn`, `pnpm`, `bun`, `deno`) and cache strategy with a single command.

---

### 📂 Use Cases

The Dev Kit CLI streamlines **development workflows** in various environments:

- **Globally Installed CLI**: Install `dk` globally for a universal **CLI scaffolding tool** on your machine.
- **Monorepo**: A single configuration file at the root can manage settings and templates for all projects, ensuring consistency across your entire codebase.
- **Multiple Repositories**: Each project can have its own `.devkitrc` file for unique settings, allowing for flexible project management.

---

### 🗺️ Supported Languages

The CLI's internationalization (i18n) feature dynamically translates commands and descriptions. Currently, the following languages are supported:

- **English** (`en`)
- **French** (`fr`)

---

### 🚀 Getting Started

This **Node.js CLI** requires Node.js and a package manager.

1.  **Prerequisites**: Ensure you have **Node.js (v18 or higher)** and a package manager installed.

2.  **Installation**: Install Dev Kit globally using your preferred package manager.

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

3.  **Verify Installation**: To confirm everything is working, run the help command.

    ```bash
    dk --help
    ```

---

### ⚙️ Usage

Here's how to get started with the Dev Kit CLI.

#### Create a new project from a template

```bash
# Create a new Vue project from your custom template
dk new vue my-awesome-app
```

#### Update your CLI configuration

Use the `config set` command to update your `.devkitrc` file.

```bash
# Set your default package manager to pnpm
dk config set pm pnpm

# Set the language to French
dk config set language fr
```

---

### Configuration

Manage your configuration either through the CLI or by manual editing.

1.  **Using the CLI**: The `dk config set` command is the recommended way to make quick and safe changes.

2.  **Manual Editing**: You can directly edit the configuration file with a text editor.
    - **Local Project**: The configuration file is located at the **root of your project**. The file created after `dk config init` is `.devkitrc`.
    - **Global Installation**: The global configuration file is typically stored in your user's home directory.

    <!-- end list -->

    ```bash
    # To view the global config file
    cat ~/.devkitrc
    ```

---

### ⚙️ How to Create and Configure a Project Configuration File

1.  **Create the Configuration File**: To initialize a local configuration file in your project, use `config init`. This creates a `.devkitrc` file.

    ```bash
    dk config init
    ```

2.  **Add the JSON Schema for Autocompletion**: Add a `$schema` property for a better developer experience with auto-completion and validation in editors like VS Code.

    ```json
    {
      "$schema": "https://shorturl.at/QDcxK",
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

3.  **Template Configuration**: Dev Kit provides a set of default templates and we'll add more over time. The `location` property for a custom template can be a local folder, a GitHub URL, or a command. Note that **cache strategies are only applied when using a GitHub URL**.

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
              "location": "https://github.com/my-user/my-template-repo"
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

4.  **Using Your New Template**: Use your custom template with the `new` command.

    ```bash
    # Create a new project from your local template
    dk new my-app my-local-template my-new-project-name
    ```

---

### 🗺️ Roadmap & Future Features

This project is in its early stages. We're committed to building a comprehensive developer toolkit.

- **Multi-Programming Language Support**: We'll progressively add templates for various frameworks and ecosystems (e.g., Python, Ruby, Go, Rust).
- **Advanced Documentation**: Detailed guides on creating and managing custom templates, with examples for various frameworks.

---

### 🤝 Contributing

We welcome contributions\! If you have a feature idea, find a bug, or want to contribute code, please open an issue or a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a pull request.

---

### 📄 License

[MIT](./LICENCE)

Copyright (c) 2025, WAFFEU Ivany Botrel Rayn

---

### Contact

Ivany Botrel Rayn WAFFEU - wibrc.se.jc@gmail.com

Project Link: [https://github.com/IT-WIBRC/devkit](https://github.com/IT-WIBRC/devkit)
