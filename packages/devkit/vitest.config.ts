import { coverageConfigDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "lcovonly"],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 90,
        statements: 85,
      },
      cleanOnRerun: true,
      reportOnFailure: true,
      exclude: [...coverageConfigDefaults.exclude, "**/i18n.ts"],
    },
  },
  resolve: {
    alias: {
      "#utils": path.resolve(__dirname, "./src/utils"),
      "#commands": path.resolve(__dirname, "./src/commands"),
    },
  },
});
