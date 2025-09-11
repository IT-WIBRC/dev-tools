# 🚀 Scaffolder-Toolkit (`dk`)

A universal CLI for professional developers to automate project scaffolding and streamline workflows.

**Scaffolder-Toolkit** (`dk`) is a powerful command-line tool designed to boost your productivity by automating repetitive tasks. Whether you're setting up a new machine or starting a new project, `dk` is your essential solution for project automation.

Built to fit the modern developer workflow, `dk` seamlessly integrates into monorepos and supports a wide range of features to help you start coding faster.

---

## ✨ Key Features

- **Unified Command:** Access all features with the short, intuitive command `dk`.
- **Intelligent Scaffolding:** Create new projects from a wide variety of popular frameworks with a single, intuitive command. You can also use custom templates for a consistent workflow. **See the list of supported templates below.**
- **Robust Configuration:** The tool reliably finds your configuration file (`.devkit.json`) in any project or monorepo structure. It uses a clear priority system to manage both local and global settings.
- **Powerful Cache Management:** Optimize project setup speed with flexible caching strategies for your templates. These strategies are mainly applied when using a GitHub URL:
  - `always-refresh`: Always pull the latest template from the remote repository.
  - `never-refresh`: Use the local cached template without checking for updates.
  - `daily` (default): Refresh the cache only once every 24 hours.
- **Seamless Internationalization (i18n):** The CLI supports multiple languages, with all commands and descriptions dynamically translated. It will automatically use the language defined in your configuration files or **detect your system's language as a fallback** for a seamless out-of-the-box experience.
- **Centralized Settings:** Manage your preferred package manager (npm, yarn, pnpm, bun) and cache strategy with a single command.

---

## 📂 Use Cases

The Scaffolder CLI streamlines development workflows in various environments:

- **Globally Installed CLI:** Install `scaffolder-toolkit` globally for a universal scaffolding tool on your machine.
- **Monorepo:** A single configuration file at the root can manage settings and templates for all projects, ensuring consistency across your entire codebase.
- **Multiple Repositories:** Each project can have its own `.devkit.json` file for unique settings, allowing for flexible project management.

---

## 🗺️ Supported Languages

The CLI's internationalization (`i18n`) feature dynamically translates commands and descriptions. Currently, the following languages are supported:

- English (`en`)
- French (`fr`)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js (v20.19.0 or higher)** and a package manager installed.

### Installation

Install Scaffolder globally using your preferred package manager.

```bash
# using bun
bun install -g scaffolder-toolkit

# using npm
npm install -g scaffolder-toolkit

# using pnpm
pnpm install -g scaffolder-toolkit

# using yarn
yarn global add scaffolder-toolkit
```

### Usage

Since this is a Node.js-based CLI, you can run it using your package manager's runner.

```bash
# using bun
bunx dk --help

# using npm
npx dk --help

# using pnpm
pnpx dk --help

# using yarn
yarn dk --help
```

> **Advice:** To use the command directly as `dk`, consider creating an **alias** in your shell configuration file (e.g., `.bashrc`, `.zshrc`, or `config.fish`).
>
> ```bash
> # Example for Bash or Zsh
> echo 'alias dk="bunx dk"' >> ~/.zshrc
> source ~/.zshrc
> ```

---

### Global Options

In addition to the options for each command, you can use a global flag that affects the entire CLI's output.

- **`--verbose`**: The verbose flag (`-v`) provides more detailed output during execution. It's particularly useful for debugging or when you want to see exactly what the CLI is doing behind the scenes, such as confirming initialization and configuration loading.

---

## 📦 Default Templates

Scaffolder comes with a set of pre-configured templates for popular frameworks and libraries. You can use these templates out of the box with the `dk new` command.

| Template Name  | Description                                            | Alias  |
| -------------- | ------------------------------------------------------ | ------ |
| `vue`          | An official Vue.js project.                            |        |
| `nuxt`         | An official Nuxt.js project.                           | `nx`   |
| `nest`         | An official Nest.js project.                           |        |
| `nextjs`       | An official Next.js project.                           | `next` |
| `express`      | A simple Express.js boilerplate.                       | `ex`   |
| `fastify`      | A highly performant Fastify web framework boilerplate. | `fy`   |
| `koa`          | A Koa.js web framework boilerplate.                    |        |
| `adonis`       | A full-stack Node.js framework (AdonisJS).             | `ad`   |
| `sails`        | A real-time, MVC framework (Sails.js).                 |        |
| `angular`      | An official Angular project (via Angular CLI).         | `ng`   |
| `angular-vite` | An Angular project using Vite (via AnalogJS).          | `ng-v` |
| `react`        | A React project using the recommended Vite setup.      | `rt`   |
| `svelte`       | A Svelte project using SvelteKit.                      |        |
| `qwik`         | An official Qwik project.                              |        |
| `astro`        | A new Astro project.                                   |        |
| `solid`        | An official SolidJS project.                           |        |
| `remix`        | An official Remix project.                             |        |

---

## ⚙️ Usage

Here's how to get started with the Scaffolder CLI.

### Create a new project from a template

The `new` command now takes a language and a project name as arguments. You can then specify the template with the `-t` or `--template` flag.

```bash
# Create a new Vue project
dk new javascript my-awesome-app -t vue
```

### Add a new template to your configuration

The `add-template` command allows you to easily register a new template with your CLI. It intelligently updates the configuration file in your current context. You must provide a `language` and `alias` (or template name) for the template, as well as a `--description`.

You must provide a `description` using the `--description` flag. Other options like `--alias`, `--cache-strategy`, and `--package-manager` are available to customize the template.

- **Global:** You can explicitly add the template to your global (`~/.devkitrc`) file using the `--global` flag.
- **Local:** It updates the `.devkit.json` file in the root of your current project.
- **Monorepo:** It updates the shared configuration at the monorepo's root.

<!-- end list -->

```bash
# Example: Add a new template from a GitHub repository
dk add-template javascript react-ts-template https://github.com/my-user/my-react-ts-template.git --description "My custom React TS template"

# Example: Add a new template from a local folder
dk add-template javascript my-local-template ./path/to/my-template-folder --description "My local template"
```

### Update a template's configuration

The `update` command allows you to modify an existing template's properties. This is useful for changing a template's alias, location, or associated package manager. You can update one or more properties in a single command.

You can also update the template's name using the `--new-name` flag, which is useful for correcting typos or renaming a template.

- **Global:** Use the `--global` flag to update the template in your global (`~/.devkitrc`) file.
- **Local:** It updates the `.devkit.json` file in the root of your current project.

<!-- end list -->

```bash
# Update the description and alias for a template
dk update javascript my-template --description "A new and improved description" --alias "my-alias"

# Update a template's package manager and remove its alias
dk update javascript my-template --package-manager bun --alias null

# Change a template's name and its description in a single command
dk update javascript my-template --new-name my-cool-template --description "A newly renamed template"
```

### Remove an existing template from your configuration

The `remove-template` command allows you to delete a template from your configuration file. You can identify the template by its name or a configured alias.

- **Global:** You can explicitly remove the template from your global (`~/.devkitrc`) file using the `--global` flag.
- **Local:** It removes the template from the `.devkit.json` file in the root of your current project.

<!-- end list -->

```bash
# Remove the 'react-ts-template' for 'javascript' from the local config
dk remove-template javascript react-ts-template

# Remove the 'node-api' template from the global config
dk remove-template node node-api --global
```

### List available templates

The `list` command allows you to view all available templates defined in your configuration. You can filter the list using optional flags to specify the configuration scope.

```bash
# List all templates, prioritizing the local config
dk list

# List templates for a specific language (e.g., 'javascript')
dk list javascript
```

---

### Options

The `list` command now uses the following options to control which templates are displayed:

- **`--local`**: Only list templates from the local configuration file (`.devkit.json`).
- **`--global`**: Only list templates from the global configuration file (`~/.devkitrc`).
- **`--all`**: List templates from both the local and global configurations, merging them into a single list.

---

### Examples

Here are some examples of how to use the new options:

```bash
# List templates only from the local configuration file
dk list --local

# List templates only from the global configuration file
dk list --global

# List templates from both local and global configs
dk list --all
```

### Manage your CLI configuration

#### Set a configuration value

The `config set` command allows you to update one or more CLI settings. By default, it updates the **local** configuration file. Use the `--global` flag to update your global settings instead.

```bash
# Set your default package manager to pnpm and the language to French in a single command (local)
dk config set pm pnpm language fr

# Set your default package manager to npm in your global config
dk config set pm npm --global
```

#### Get a configuration value

The `config get` command allows you to view the current value of a configuration setting. If no key is specified, it will show the entire configuration file.

```bash
# Get the value of the 'defaultPackageManager' setting
dk config get pm

# Get the value of the 'language' setting from the global config
dk config get language --global

# Display the entire local configuration file
dk config get
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
- `update` -\> `up`
- `add-template` -\> `at`
- `remove-template` -\> `rt`
- `list` -\> `ls`

---

## ⚙️ Configuration

Manage your configuration either through the CLI or by manual editing.

### Configuration Hierarchy

Scaffolder now loads settings with a clear priority to give you maximum control and flexibility.

1.  **Local Project Configuration (`./.devkit.json`)**: This file, at the root of your project, takes the **highest priority**.
2.  **Global Configuration (`~/.devkitrc`)**: This file, stored in your user's home directory, is used for all projects on your machine and is overridden by a local configuration.
3.  **System Language Detection**: If a language setting is not found in either the local or global configuration, `dk` will **automatically detect your system's language** and load the corresponding translations.
4.  **Default**: If none of the above are found, the language will default to English (`en`).

### Creating a New Template (The Full Workflow)

Scaffolder allows you to create and use your own templates in three simple steps.

#### Step 1: Create the Template Project

First, build your template. This is a standard project directory containing all the files you want to use. You can use any type of project, from a simple boilerplate to a complex custom setup.

#### Step 2: Add the Template to Your Config

Once your template project is ready, use the `add-template` command to register it with the CLI. This command adds the template's details to your `.devkit.json` file, making it available for use.

```bash
# Add a template from a local folder to your global config
dk add-template javascript custom-js-app /Users/myuser/projects/my-template --description "My personal JavaScript boilerplate" --global
```

#### Step 3: Use the Template

After running the `add-template` command, you can scaffold a new project from your template using `dk new`.

```bash
# Create a new project from the template we just added
dk new javascript my-awesome-project -t custom-js-app
```

### Create and configure a project file

The `init` command allows you to initialize a configuration file at different scopes.

**Note:** If a configuration file already exists at the specified location, you will be prompted to confirm if you want to overwrite it.

- To initialize a **local** configuration file in your current project, use the `--local` flag, or run the command without any flags. The file will be named `.devkit.json`.
- To initialize a **global** configuration file, use the `--global` flag. The file will be named `.devkitrc`.

<!-- end list -->

```bash
# Initialize a local configuration file in the current directory (default)
dk init

# Initialize a local configuration file in the current directory (explicit)
dk init --local

# Initialize a global configuration file
dk init --global
```

### Add the JSON Schema for Autocompletion

To get autocompletion and validation for your `.devkit.json` or `.devkitrc` file, you have a couple of options.

#### Option 1: Direct Link in the JSON File

This is the recommended approach for most developers. Simply add the `$schema` property as the very first key in your `.devkit.json` or `.devkitrc` file. Modern editors like VS Code will automatically read this property and apply the schema without any additional configuration.

```json
{
  "$schema": "https://gist.githubusercontent.com/IT-WIBRC/baab4cc74a28af5b23936f5cf576f8e6/raw/ed7445f123554cf5ed7fc6fb727d1faae22a9bed/devkit-schema.json",
  "settings": {
    "language": "fr",
    "defaultPackageManager": "npm",
    "cacheStrategy": "daily"
  },
  "templates": {
    "javascript": {
      "templates": {
        "react": {
          "description": "A robust React project with TypeScript",
          "location": "https://github.com/IT-WIBRC/react-ts-template.git",
          "alias": "rt"
        },
        "nextjs": {
          "description": "A Next.js project with ESLint and TypeScript",
          "location": "{pm} create next-app@latest",
          "packageManager": "npm"
        }
      }
    }
  }
}
```

#### Option 2: IDE-specific Configuration

If you do not want to add the `$schema` property directly to your file, you can configure your IDE's settings to link the file name to the schema URL. This is useful for monorepos or when you need a global setting.

For VS Code, open your **`settings.json`** file and add the following entry:

```json
{
  "json.schemas": [
    {
      "fileMatch": [".devkit.json", ".devkitrc"],
      "url": "https://gist.githubusercontent.com/IT-WIBRC/baab4cc74a28af5b23936f5cf576f8e6/raw/ed7445f123554cf5ed7fc6fb727d1faae22a9bed/devkit-schema.json"
    }
  ]
}
```

Or using the one from `node_modules`(recommended if you have it installed):

```json
{
  "json.schemas": [
    {
      "fileMatch": [".devkit.json", ".devkitrc"],
      "url": "node_modules/scaffolder-toolkit/devkit-schema.json"
    }
  ]
}
```

#### Option 3: Offline Schema

If you prefer to have the schema available offline, you can download the JSON file and link to it locally. This ensures autocompletion and validation work even without an internet connection.

1.  **Download the schema:** Save the file from the URL provided above (`devkit-schema.json`) to a permanent location on your computer.
2.  **Update your IDE settings:** In your `settings.json`, replace the `url` with a local file path.

Example for macOS/Linux:

```json
{
  "json.schemas": [
    {
      "fileMatch": [".devkit.json", ".devkitrc"],
      "url": "/Users/your-username/my-schemas/devkit-schema.json"
    }
  ]
}
```

Example for Windows:

```json
{
  "json.schemas": [
    {
      "fileMatch": [".devkit.json", ".devkitrc"],
      "url": "C:\\Users\\your-username\\my-schemas\\devkit-schema.json"
    }
  ]
}
```

### Template Configuration

Scaffolder provides a set of default templates and we'll progressively add more. The `location` property for a custom template can be an **absolute path**, a **relative path**, a GitHub URL, or a command. Note that cache strategies are only applied when using a GitHub URL.

You can also define an **`alias`** to make it easier to reference a specific template. An alias is a simple shortcut for a template's name.

```json
{
  "templates": {
    "javascript": {
      "templates": {
        "my-local-template": {
          "description": "A template from my local machine",
          "location": "/Users/myuser/projects/my-local-template"
        },
        "from-github": {
          "description": "A template from a GitHub repository",
          "location": "https://github.com/my-user/my-template-repo.git",
          "alias": "gh-template",
          "cacheStrategy": "daily"
        },
        "from-create-command": {
          "description": "Uses the native `create` command",
          "location": "{pm} create nuxt@latest",
          "packageManager": "bun"
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
dk new javascript my-new-project-name -t gh-template
```

---

## 🗺️ Roadmap & Future Features

This project is in its early stages. We're committed to building a comprehensive developer toolkit.

- **Multi-Programming Language Support:** We'll progressively add templates for various frameworks and ecosystems (e.g., Python, Ruby, Go, Rust).
- **Advanced Documentation:** Detailed guides on creating and managing custom templates, with examples for various frameworks.

We're always working to improve the Scaffolder CLI. For a complete list of planned features, bug fixes, and development tasks, please see our [TODO list](./TODO.md).

---

## 🤝 Contributing

We welcome contributions. Please see our [Contribution Guide](../../CONTRIBUTING.md) for details on how to get started.

---

## 📄 License

MIT

Copyright (c) 2025, WAFFEU Ivany Botrel Rayn
Contact
Ivany Botrel Rayn WAFFEU - wibrc.se.jc@gmail.com
