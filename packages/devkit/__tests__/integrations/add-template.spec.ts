import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
} from "../../src/utils/configs/schema.js";

const CLI_PATH = path.resolve("./dist/main.js");
const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;

const baseLocalConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    javascript: {
      templates: {
        "vue-basic": {
          description: "A basic Vue template",
          location: "https://github.com/vuejs/vue",
          alias: "vb",
        },
      },
    },
  },
};

const baseGlobalConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    python: {
      templates: {
        django: {
          description: "A Django template",
          location: "https://github.com/django/django",
          alias: "dj",
        },
      },
    },
  },
};

describe("dk add-template", () => {
  beforeAll(() => {
    vi.unmock("execa");
    globalConfigDir = path.join(os.tmpdir(), "devkit-global-config-dir");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-add-template-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should successfully add a new template to the local config", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "react-app",
        "https://github.com/facebook/react",
        "--description",
        "A basic React application",
        "--alias",
        "ra",
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'react-app' added successfully!");
    expect(updatedConfig.templates.javascript.templates["react-app"]).toEqual({
      description: "A basic React application",
      location: "https://github.com/facebook/react",
      alias: "ra",
    });
  });

  it("should successfully add a new template to the global config with --global", async () => {
    const globalConfigPath = path.join(
      globalConfigDir,
      GLOBAL_CONFIG_FILE_NAME,
    );
    await fs.writeJson(globalConfigPath, baseGlobalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "python",
        "flask-api",
        "https://github.com/pallets/flask",
        "--description",
        "A Flask API starter project",
        "--global",
        "--cache-strategy",
        "daily",
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(globalConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'flask-api' added successfully!");
    expect(updatedConfig.templates.python.templates["flask-api"]).toEqual({
      description: "A Flask API starter project",
      location: "https://github.com/pallets/flask",
      cacheStrategy: "daily",
    });
  });

  it("should fail to add a template if the language is not found", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "typescript",
        "nest-app",
        "https://github.com/nestjs/typescript-starter",
        "--description",
        "A Nest.js app",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Scaffolding language not found in configuration: 'typescript'",
    );
  });

  it("should fail to add a template if the template name already exists", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "vue-basic",
        "https://github.com/vuejs/vue",
        "--description",
        "Duplicate template",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Template 'vue-basic' already exists in the configuration. Use 'devkit config set' to update it.",
    );
  });

  it("should fail to add a template if the alias already exists", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "new-template",
        "https://github.com/new-template",
        "--description",
        "New template with duplicate alias",
        "--alias",
        "vb",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Alias 'vb' already exists for another template in this language. Please choose a different alias.",
    );
  });

  it("should fail if local config is not found and --global is not used", async () => {
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "react-app",
        "https://github.com/facebook/react",
        "--description",
        "A basic React application",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Configuration file not found.",
    );
  });

  it("should fail if global config is not found and --global is used", async () => {
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "python",
        "flask-api",
        "https://github.com/pallets/flask",
        "--description",
        "A Flask API starter project",
        "--global",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Configuration file not found.",
    );
  });

  it("should fail on an invalid cache strategy value", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "invalid-cache",
        "https://github.com/test",
        "--description",
        "Test",
        "--cache-strategy",
        "invalid-value",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Invalid cache strategy: 'invalid-value'. Valid options are: always-refresh, never-refresh, daily",
    );
  });

  it("should fail on an invalid package manager value", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "javascript",
        "invalid-pm",
        "https://github.com/test",
        "--description",
        "Test",
        "--package-manager",
        "invalid-pm",
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Invalid package manager: 'invalid-pm'. Valid options are: bun, npm, yarn, deno, pnpm",
    );
  });
});
