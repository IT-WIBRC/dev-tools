import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import copy from "rollup-plugin-copy";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/bundle.js",
    format: "esm",
    sourcemap: false,
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    copy({
      targets: [{ src: "locales", dest: "dist" }],
      copyOnce: false,
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
  ],
};
