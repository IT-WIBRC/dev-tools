import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/bundle.js",
    format: "esm",
  },
  plugins: [
    json(),
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
  external: [
    "path",
    "fs",
    "os",
    "tty",
    "readline",
    "commander",
    "@inquirer/prompts",
  ],
};
