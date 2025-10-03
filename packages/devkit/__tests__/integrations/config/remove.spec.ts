import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import path from "path";
import os from "os";
import {
  CLI_PATH,
  fs,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
  execute,
} from "../common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;

const localConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    javascript: {
      templates: {
        "react-ts": {
          description: "A React project with TypeScript",
          location: "https://github.com/react-ts-template",
          alias: "rt",
          packageManager: "npm",
        },
        "vue-basic": {
          description: "A basic Vue template",
          location: "https://github.com/vuejs/vue",
          alias: "vb",
        },
        "node-cli": {
          description: "A Node.js CLI template",
          location: "https://github.com/node-cli-template",
        },
      },
    },
  },
};

const globalConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    javascript: {
      templates: {
        "global-react-ts": {
          description: "A global React project with TypeScript",
          location: "https://github.com/react-ts-template-global",
          alias: "grt",
        },
        "global-lib": {
          description: "A global library template",
          location: "https://github.com/global-lib",
        },
      },
    },
  },
};

describe("dk config remove - Basic and Alias", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-remove-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should remove a single template from the local config by name", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "vue-basic"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 1 template(s) (vue-basic) from javascript.",
    );
    expect(
      updatedConfig.templates.javascript.templates["vue-basic"],
    ).toBeUndefined();
    expect(
      updatedConfig.templates.javascript.templates["react-ts"],
    ).toBeDefined();
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(2);
  });

  it("should remove multiple templates at once by name", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "vue-basic", "react-ts"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 2 template(s) (vue-basic, react-ts) from javascript.",
    );
    expect(
      updatedConfig.templates.javascript.templates["vue-basic"],
    ).toBeUndefined();
    expect(
      updatedConfig.templates.javascript.templates["react-ts"],
    ).toBeUndefined();
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(1);
  });

  it("should remove templates by alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "rt"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 1 template(s) (react-ts) from javascript.",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"],
    ).toBeUndefined();
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(2);
  });
});

describe("dk config remove - Wildcard Support", () => {
  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-remove-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should remove ALL local templates using the wildcard '*'", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "*"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 3 template(s) (react-ts, vue-basic, node-cli) from javascript.",
    );
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(0);
  });

  it("should remove ALL global templates using the wildcard '*' with --global", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "--global", "remove", "javascript", "*"],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 2 template(s) (global-react-ts, global-lib) from javascript.",
    );
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(0);
  });

  it("should remove all templates and warn for explicitly listed not-found names when using wildcard", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "remove",
        "javascript",
        "*",
        "non-existent-A",
        "non-existent-B",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 3 template(s) (react-ts, vue-basic, node-cli) from javascript.",
    );
    expect(all).toContain(
      "⚠️ The following templates were not found: non-existent-A, non-existent-B",
    );
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(0);
  });
});

describe("dk config remove - Global and Edge Cases", () => {
  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-remove-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should remove a template from the global config when --global is used", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "--global", "rm", "javascript", "global-lib"],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 1 template(s) (global-lib) from javascript.",
    );
    expect(
      updatedConfig.templates.javascript.templates["global-lib"],
    ).toBeUndefined();
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(1);
  });

  it("should show a warning for templates not found while removing others", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "vue-basic", "not-found"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully removed 1 template(s) (vue-basic) from javascript.",
    );
    expect(all).toContain(
      "⚠️ The following templates were not found: not-found",
    );
    expect(
      updatedConfig.templates.javascript.templates["vue-basic"],
    ).toBeUndefined();
    expect(
      Object.keys(updatedConfig.templates.javascript.templates).length,
    ).toBe(2);
  });

  it("should show an error if no templates are found to remove", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "remove",
        "javascript",
        "not-found-1",
        "not-found-2",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Template 'not-found-1, not-found-2' not found in configuration.",
    );
  });

  it("should throw an error if the specified language is not found", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "rust", "my-template"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Invalid value for Programming Language. Valid options are: javascript",
    );
  });

  it("should throw an error if no config file exists to remove from (local)", async () => {
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "remove", "javascript", "vue-basic"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("No configuration file found.");
  });

  it("should throw an error if no config file exists to remove from (global)", async () => {
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "--global", "remove", "javascript", "vue-basic"],
      { all: true, reject: false, env: { HOME: globalConfigDir } },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("Global configuration file not found.");
  });
});
