# scaffolder-toolkit

## 1.0.6

### Patch Changes

- edaff67: chore: fix missing locales on build

## 1.0.5

### Patch Changes

- 2c741c5: ### Summary of Changes

  This release addresses a critical build issue by migrating the project's build system from `esbuild` to **Rollup**. This change resolves the `Dynamic require` bug for CommonJS dependencies, ensuring the CLI builds and runs correctly in a Node.js environment.

  ***

  ### Key Changes:
  - **Build Pipeline Migration:** Replaced the `esbuild` build process with a **Rollup** configuration to correctly handle CJS dependencies.
  - **CommonJS Compatibility:** Integrated and configured `@rollup/plugin-commonjs` to resolve `require` calls in third-party libraries.
  - **External Dependencies:** Explicitly marked Node.js built-in modules (`fs`, `path`, etc.) and project dependencies as `external` in the Rollup config, preventing them from being bundled. This is a best practice for Node.js CLI tools.
  - **JSON Handling:** Added `@rollup/plugin-json` to the build process to correctly import `.json` files from dependencies.
  - **Build Artifacts:** Adjusted the configuration to prevent the generation of sourcemap files.
  - **Test Suite Reliability:** Updated integration tests to be more resilient to inconsistent CLI output, using regular expressions and whitespace normalization to ensure reliable assertions.
  - **Documentation:** Updated the `README.md` to reflect the new global installation advice and correct minor Markdown formatting issues.

## 1.0.4

### Patch Changes

- f1b3fe8: Adjust build process to make it more light

## 1.0.3

### Patch Changes

- 12cd2ce: Change build to bundling to support environment

## 1.0.2

### Patch Changes

- f7109f0: Add build (dist) result to the npm published package
- 54d6400: Fix the documentation error and naming

## 1.0.1

### Patch Changes

- d4b82df: Fix the documentation error and naming

## 1.0.0

### Major Changes

- 215e20f: ### **Summary of Changes for Version 1.0.0**

  This release marks a significant milestone for the project, transitioning it from a standalone CLI to a multi-tool **monorepo**. This update focuses entirely on the project's internal architecture, laying a stable and scalable foundation for all future developer tools.

  #### **Key Highlights:**
  - **Monorepo Migration**: The project has been restructured to use Bun Workspaces, allowing for the co-development of multiple tools within a single repository.
  - **Unified Build System**: The build process is now managed from the monorepo root, enabling a single command to build all present and future tools in the correct dependency order.
  - **Streamlined Documentation**: The repository now has a centralized `README.md` at the root, which acts as a directory for all individual tool documentation.
  - **Dependency Management**: All dependencies are now centrally hoisted to the monorepo root, ensuring a more efficient and consistent development environment.
