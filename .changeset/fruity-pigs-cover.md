---
"scaffolder-toolkit": patch
---

### Summary of Changes

This release addresses a critical build issue by migrating the project's build system from `esbuild` to **Rollup**. This change resolves the `Dynamic require` bug for CommonJS dependencies, ensuring the CLI builds and runs correctly in a Node.js environment.

---

### Key Changes:

- **Build Pipeline Migration:** Replaced the `esbuild` build process with a **Rollup** configuration to correctly handle CJS dependencies.
- **CommonJS Compatibility:** Integrated and configured `@rollup/plugin-commonjs` to resolve `require` calls in third-party libraries.
- **External Dependencies:** Explicitly marked Node.js built-in modules (`fs`, `path`, etc.) and project dependencies as `external` in the Rollup config, preventing them from being bundled. This is a best practice for Node.js CLI tools.
- **JSON Handling:** Added `@rollup/plugin-json` to the build process to correctly import `.json` files from dependencies.
- **Build Artifacts:** Adjusted the configuration to prevent the generation of sourcemap files.
- **Test Suite Reliability:** Updated integration tests to be more resilient to inconsistent CLI output, using regular expressions and whitespace normalization to ensure reliable assertions.
- **Documentation:** Updated the `README.md` to reflect the new global installation advice and correct minor Markdown formatting issues.
