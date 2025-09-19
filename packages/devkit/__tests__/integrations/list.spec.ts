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
import path from "path";
import os from "os";
import {
  CLI_PATH,
  fs,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
} from "./common.js";

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
      },
    },
    node: {
      templates: {
        "node-api": {
          description: "A Node.js API boilerplate",
          location: "https://github.com/node-api",
          alias: "na",
        },
      },
    },
  },
};

const globalConfig: CliConfig = {
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

describe("dk list", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-list-${Date.now()}`);
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

  it("should list templates from local config by default when it exists", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Available Templates:");
    expect(all).toContain("JAVASCRIPT");
    expect(all).toContain("NODE");
    expect(all).not.toContain("PYTHON");
  });

  it("should fall back to global config if no local config exists", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "No local configuration found. Using templates from global configuration.",
    );
    expect(all).toContain("Available Templates:");
    expect(all).toContain("PYTHON");
    expect(all).not.toContain("JAVASCRIPT");
    expect(all).not.toContain("NODE");
  });

  it("should list templates from both local and global configurations when --all is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa("bun", [CLI_PATH, "list", "--all"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Available Templates:");
    expect(all).toContain("JAVASCRIPT");
    expect(all).toContain("NODE");
    expect(all).toContain("PYTHON");
  });

  it("should only list templates from local config when --local is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "list", "--local"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Using templates from local configuration.");
    expect(all).toContain("Available Templates:");
    expect(all).toContain("JAVASCRIPT");
    expect(all).toContain("NODE");
    expect(all).not.toContain("PYTHON");
  });

  it("should only list templates from global config when --global is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "list", "--global"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Using templates from global configuration.");
    expect(all).toContain("Available Templates:");
    expect(all).toContain("PYTHON");
    expect(all).not.toContain("JAVASCRIPT");
    expect(all).not.toContain("NODE");
  });

  it("should filter templates by name when --filter is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "list", "--filter", "vue"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Available Templates:");
    expect(all).toContain("vue-basic");
    expect(all).not.toContain("REACT-TS");
    expect(all).not.toContain("NODE-API");
  });

  it("should filter templates by alias when --filter is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "list", "--filter", "rt"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Available Templates:");
    expect(all).toContain("react-ts");
    expect(all).not.toContain("VUE-BASIC");
    expect(all).not.toContain("NODE-API");
  });

  it("should show an error if a language filter is provided but no templates are found for it", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { all, exitCode } = await execa("bun", [CLI_PATH, "list", "rust"], {
      all: true,
      env: { HOME: globalConfigDir },
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Programming language not found in configuration: 'rust'",
    );
  });

  it("should handle a config file with an empty templates section", async () => {
    const emptyConfig = { ...localConfig, templates: {} };
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), emptyConfig);
    const { all, exitCode } = await execa("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ No templates found in the configuration file.");
  });

  it("should handle both local and global configs being empty", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), {
      templates: {},
    });
    await fs.writeJson(path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME), {
      templates: {},
    });

    const { all, exitCode } = await execa("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ No templates found in the configuration file.");
  });
});
