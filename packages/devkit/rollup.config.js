import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import alias from "@rollup/plugin-alias";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  input: "src/main.ts",
  output: {
    dir: "bin",
    entryFileNames: "scaffolder-toolkit.js",
    chunkFileNames: "chunks/[name]-[hash].js",
    format: "esm",
    sourcemap: false,
  },
  plugins: [
    alias({
      entries: [
        { find: /^#(.*)/, replacement: path.resolve(__dirname, "src/$1") },
        { find: "#locales", replacement: path.resolve(__dirname, "locales") },
        {
          find: "#scaffolding",
          replacement: path.resolve(__dirname, "src/scaffolding"),
        },
        { find: "#utils", replacement: path.resolve(__dirname, "src/utils") },
        {
          find: "#commands",
          replacement: path.resolve(__dirname, "src/commands"),
        },
      ],
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
      extensions: [".ts", ".js", ".json"],
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
  external: [
    "path",
    "fs",
    "os",
    "chalk",
    "yargs",
    "ora",
    "@inquirer/prompts",
    "commander",
    "child_process",
    "module",
    "execa",
    "unicorn-magic",
  ],
  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      console.warn(`Circular dependency detected:\n${warning.message}`);
    } else {
      warn(warning);
    }
  },
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
  preserveEntrySignatures: "strict",
};
