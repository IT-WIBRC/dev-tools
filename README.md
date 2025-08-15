# 🚀 Dev Kit (`dk`)

### A universal CLI for professional developers to automate project scaffolding and streamline workflows.

**Dev Kit** (`dk`) is a powerful command-line interface tool engineered to save you time by eliminating repetitive development tasks. Whether you're setting up a new machine or starting a new project, `dk` is your go-to solution for project automation.

Built with modern tooling in mind, `dk` seamlessly integrates into monorepos and supports a wide range of features to get you coding faster.

---

### ✨ **Key Features**

- **Unified Command**: Use both `devkit` and the short command `dk` for all commands.
- **Intelligent Scaffolding**: Create new projects from your favorite frameworks with a single, intuitive command. You can use your own custom templates for a consistent workflow.
- **Robust Configuration**: The tool reliably finds your configuration file (`.devkitrc` or `.devkitrc.json`) in any project or monorepo structure by searching upwards from the current directory.
- **Powerful Cache Management**: Optimize project setup speed with flexible caching strategies for your templates:
  - `always-refresh`: Always pull the latest template from the remote repository.
  - `never-refresh`: Use the local cached template without checking for updates.
  - `daily` (default): Refresh the cache only once every 24 hours.
- **Seamless Internationalization (i18n)**: The CLI supports multiple languages, with all commands and descriptions dynamically translated based on your configuration.
- **Centralized Settings**: Use `dk config` to manage global settings like your preferred package manager (`npm`, `yarn`, `pnpm`, `bun`) and cache strategy.

---

### 🚀 **Getting Started**

This tool is a Node.js CLI. Before you can install it, you need to have Node.js and a package manager installed on your system.

1.  **Prerequisites**: Ensure you have **Node.js (v18 or higher)** and a package manager (`npm`, `yarn`, `pnpm`, or `bun`) installed.

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

### ⚙️ **Usage**

Here are some examples to get started with the Dev Kit CLI.

#### **Create a new project from a template**

```bash
# Create a new Vue project from your custom template
dk new vue my-awesome-app
```

#### **Update your CLI configuration**

You can use the `config set` command to update your `.devkitrc` or `.devkitrc.json` file.

```bash
# Set your default package manager to pnpm
dk config set pm pnpm

# Set the language to French
dk config set language fr
```

---

### **Configuration**

You can manage your configuration in two ways:

1.  **Using the CLI**: Use the `dk config set` command as shown above. This is the recommended method for making quick and safe changes.

2.  **Manual Editing**: You can directly edit the configuration file with a text editor.
    - **Local Project**: The configuration file is located at the **root of your project**. The file name will be `.devkitrc` or `.devkitrc.json`.
    - **Global Installation**: The global configuration file is typically stored in your user's home directory. You can find it by looking for `.devkitrc` in your home folder.

    <!-- end list -->

    ```bash
    # To view the global config file
    cat ~/.devkitrc
    ```

---

### 🗺️ **Roadmap & Future Features**

This project is in its early stages, and we are committed to building a comprehensive developer toolkit.

- **Multi-Language Support**: Extend the scaffolding tool to support other languages and ecosystems (e.g., Python, Ruby, Go).
- **Advanced Documentation**: Detailed guides on creating and managing custom templates, with examples for various frameworks.

---

### 🤝 **Contributing**

We welcome contributions\! If you have a feature idea, find a bug, or want to contribute code, please open an issue or a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a pull request.

---

### 📄 **License**

[MIT](./LICENCE)

Copyright (c) 2019-present, WAFFEU (Ivany Botrel) Rayn

---

### **Contact**

Your Name - Ivany Botrel Rayn WAFFEU - wibrc.se.jc@gmail.com

Project Link: [https://github.com/IT-WIBRC/devkit](https://github.com/IT-WIBRC/devkit)
