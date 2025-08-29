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

const localConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    node: {
      templates: {
        "node-api": {
          description: "A Node.js API boilerplate",
          location: "https://github.com/node-api",
          alias: "na",
        },
      },
    },
    javascript: {
      templates: {
        "react-ts": {
          description: "A React project with TypeScript",
          location: "https://github.com/react-ts-template",
          alias: "rt",
          packageManager: "npm",
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

describe("dk remove-template", () => {
  beforeAll(() => {
    vi.unmock("execa");
    globalConfigDir = path.join(os.tmpdir(), "devkit-global-config-dir");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(
      os.tmpdir(),
      `devkit-test-remove-template-${Date.now()}`,
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

  it("should successfully remove a template from the local config", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, localConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "node", "node-api"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "✅ Template 'node-api' for 'node' removed successfully!",
    );
    expect(updatedConfig.templates.node.templates["node-api"]).toBeUndefined();
    expect(
      updatedConfig.templates.javascript.templates["react-ts"],
    ).toBeDefined();
  });

  it("should successfully remove a template using an alias from the local config", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, localConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "javascript", "rt"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "✅ Template 'rt' for 'javascript' removed successfully!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"],
    ).toBeUndefined();
  });

  it("should successfully remove a template from the global config using --global", async () => {
    const globalConfigPath = path.join(
      globalConfigDir,
      GLOBAL_CONFIG_FILE_NAME,
    );
    await fs.writeJson(globalConfigPath, globalConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "python", "django", "--global"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    const updatedConfig = await fs.readJson(globalConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "✅ Template 'django' for 'python' removed successfully!",
    );
    expect(updatedConfig.templates.python.templates.django).toBeUndefined();
  });

  it("should fail to remove a template if no local config exists and --global is not used", async () => {
    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "node", "node-api"],
      {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "No configuration file found. Run 'devkit config init' to create a global one, or 'devkit config init --local' to create a local one.",
    );
  });

  it("should fail to remove a template if the specified language is not found", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, localConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "rust", "rust-api"],
      {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Scaffolding language not found in configuration: 'rust'",
    );
  });

  it("should fail to remove a template if the template name/alias is not found", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, localConfig, { spaces: 2 });

    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "remove-template", "node", "non-existent-template"],
      {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Template 'non-existent-template' not found in configuration.",
    );
  });
});
