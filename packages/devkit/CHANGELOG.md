# scaffolder-toolkit

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

