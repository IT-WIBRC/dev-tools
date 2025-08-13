# Dev Kit (`dk`)

### A universal, personal CLI tool to streamline your entire development workflow.

**Dev Kit** (`dk`) is a command-line interface tool designed by and for developers. Its mission is to eliminate the repetitive tasks of setting up a new dev machine and scaffolding new projects, allowing you to get straight to coding.

This tool is built is about:

**Project Scaffolding**: Create new projects for your favorite frameworks with your own custom structure.

-----

### ✨ **Features (Phase 1: Project Scaffolding)**

  * **Unified Command**: Use both `devkit` and the short command `dk` for all commands.
  * **Intuitive Scaffolding**: Create new projects with a single command.
      * `dk new`: Launches an interactive menu to guide you through project creation.
      * `dk new [framework]`: Quickly scaffold projects for supported frameworks (e.g., `dk new vue`).
  * **Hybrid Templating**: Choose between your own templates or the official framework CLIs.
      * `dk new vue` uses your custom template by default.
      * `dk new vue --official` (`-o`) runs the official Vue CLI.
  * **Configurable**: Use a `devkit.json` file to define and manage your own custom templates, making them available in the main menu.
  * **Node.js Version Management**: Seamlessly integrates with `nvm` to allow you to select a specific Node.js version when creating a new project.

### 🚀 **Getting Started**

This tool is a Node.js CLI. Before you can install it, you need to have Node.js and a package manager (like `npm`) on your system. We are creating a separate Bash script for that, but for now, you can follow these steps:

1.  **Prerequisites**: Ensure you have Node.js (v18 or higher recommended) and npm installed.

2.  **Installation**: Install Dev Kit globally from npm.

    ```bash
    npm install -g devkit
    ```

3.  **Verify Installation**: To confirm everything is working, run the help command.

    ```bash
    dk --help
    ```

### ⚙️ **Usage**

Here are some examples of how to use the Dev Kit tool.

#### **Create a new project (interactive mode)**

```bash
dk new
```

This will walk you through a series of prompts to create your new project.

#### **Create a new Vue project with your custom template**

```bash
dk new vue --name my-awesome-app
```

#### **Create a new Nuxt project using the official Nuxt CLI**

```bash
dk new nuxt --official
```

-----

### 🗺️ **Roadmap & Future Features**

This project is in its early stages. Here are some of the planned features for future versions:

  * **System Setup (Phase 2)**: Create a separate Bash script to automate the installation of essential dev tools like Zsh, `nvm`, Node.js, IDEs, browsers, and more.
  * **Multi-Language Support**: Extend the scaffolding tool to support other languages and ecosystems (e.g., Python, Ruby).
  * **Documentation**: Detailed guides on creating and managing custom templates.

### 🤝 **Contributing**

We welcome contributions\! If you have a feature idea, find a bug, or want to contribute code, please open an issue or a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a pull request.

-----

### 📄 **License**

Distributed under the MIT License. See `LICENSE` for more information.

-----

### **Contact**

Your Name - Ivany Botrel Rayn WAFFEU - wibrc.se.jc@gmail.com

Project Link: [https://github.com/IT-WIBRC/devkit](https://github.com/IT-WIBRC/devkit)
