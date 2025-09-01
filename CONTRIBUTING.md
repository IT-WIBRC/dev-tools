First off, thank you for considering contributing to DevKit! It's people like you that make open source such a great community. We appreciate your time and effort.

The following is a set of guidelines for contributing to DevKit. These are mostly guidelines, not strict rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## ⚖️ Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct.html). By participating, you are expected to uphold this code.

## 🐛 How to Report a Bug

Before submitting a bug report, please check if the issue has already been reported. If you find a similar issue, you can add a comment to it instead of opening a new one.

When creating a new bug report, please use our **[Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)** to provide the necessary information. This helps us understand and fix the problem more quickly.

## ✨ How to Suggest an Enhancement

We're always looking for ways to improve DevKit! Use our **[Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)** to suggest a new feature or enhancement. A good feature request includes a clear description of the problem you're facing and the solution you have in mind.

## 💻 Your First Contribution

If you're looking for an issue to get started with, check out the issues with the "good first issue" label.

### Development Setup

To contribute code, you'll need to set up your local development environment.

1.  **Fork the repository** on GitHub.
2.  **Clone your forked repository** to your local machine.
    ```bash
    git clone [https://github.com/IT-WIBRC/dev-tools.git](https://github.com/IT-WIBRC/dev-tools.git)
    cd dev-tools
    ```
3.  **Install dependencies**. DevKit uses a package manager.
    ```bash
    bun install # or yarn install, pnpm install, bun install
    ```
4.  **Build the project** to compile the TypeScript code.
    ```bash
    bun run build
    ```
5.  **Run the CLI locally** using `npm link` or `bun link`. This will make the `dk` command available globally on your machine and point it to your local source code.
    ```bash
    bun link
    ```
    Now you can run `dk --help` to test your local changes.

### Submitting a Pull Request

When you're ready to submit your changes, please use our **[Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)** to ensure all required information is provided.

**Commit Message Convention**
We use Conventional Commits for our commit messages. This allows for automated changelog generation and versioning.

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Example:**
`feat: add support for pnpm package manager`

**Before Submitting**

- Make sure your changes are formatted and linted correctly.
- Run the tests (`bun test:unit`) to ensure everything works as expected.

Thank you for your contribution!
