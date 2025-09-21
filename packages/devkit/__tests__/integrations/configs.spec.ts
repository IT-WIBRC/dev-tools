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

const baseLocalConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    ...defaultCliConfig.templates,
    typescript: {
      ...defaultCliConfig.templates.typescript,
      templates: {
        "existing-template": {
          description: "An existing template.",
          location: "./some/path",
        },
      },
    },
  },
};

async function setupTestEnvironment(): Promise<void> {
  originalCwd = process.cwd();
  tempDir = path.join(os.tmpdir(), `devkit-test-config-${Date.now()}`);
  await fs.ensureDir(tempDir);
  process.chdir(tempDir);

  globalConfigDir = path.join(
    os.tmpdir(),
    `devkit-global-config-${Date.now()}`,
  );
  await fs.ensureDir(globalConfigDir);
}

async function teardownTestEnvironment(): Promise<void> {
  process.chdir(originalCwd);
  await fs.remove(tempDir);
  await fs.remove(globalConfigDir);
}

describe("dk config commands - Integration Tests", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    await setupTestEnvironment();
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), baseLocalConfig);
  });

  afterEach(async () => {
    await teardownTestEnvironment();
  });

  describe("Non-interactive mode: --set", () => {
    it("should set a single config value in settings correctly", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [CLI_PATH, "config", "--set", "pm", "bun"],
        { all: true },
      );
      console.log(all);

      const updatedConfig = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration updated successfully!");
      expect(updatedConfig.settings.defaultPackageManager).toBe("bun");
    });

    it.skip("should set multiple config values in settings correctly", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [CLI_PATH, "config", "--set", "pm", "yarn", "language", "fr"],
        { all: true },
      );

      const updatedConfig = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration updated successfully!");
      expect(updatedConfig.settings.defaultPackageManager).toBe("yarn");
      expect(updatedConfig.settings.language).toBe("fr");
    });

    it.skip("should update a global config file when --global flag is used", async () => {
      const globalConfigPath = path.join(
        globalConfigDir,
        GLOBAL_CONFIG_FILE_NAME,
      );
      await fs.writeJson(globalConfigPath, defaultCliConfig);

      const { exitCode, all } = await execa(
        "bun",
        [CLI_PATH, "config", "--set", "language", "fr", "--global"],
        { all: true, env: { HOME: globalConfigDir } },
      );

      const globalConfigContent = await fs.readJson(globalConfigPath);

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration updated successfully!");
      expect(globalConfigContent.settings.language).toBe("fr");
    });

    it.skip("should show an error for an invalid key", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [CLI_PATH, "config", "--set", "invalid_key", "value"],
        { all: true, reject: false },
      );

      expect(exitCode).not.toBe(0);
      expect(all).toContain("Invalid key: 'invalid_key'.");
    });
  });

  describe.skip("Non-interactive mode: --template", () => {
    it("should update a single template property correctly", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [
          CLI_PATH,
          "config",
          "--template",
          "typescript",
          "existing-template",
          "--description",
          "A cool new description",
        ],
        { all: true },
      );

      const updatedConfig = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Template 'existing-template' updated successfully!");
      expect(
        updatedConfig.templates.typescript.templates["existing-template"]
          .description,
      ).toBe("A cool new description");
    });

    it("should update multiple template properties correctly", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [
          CLI_PATH,
          "config",
          "--template",
          "typescript",
          "existing-template",
          "--alias",
          "ext",
          "--package-manager",
          "npm",
        ],
        { all: true },
      );

      const updatedConfig = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Template 'existing-template' updated successfully!");
      const template =
        updatedConfig.templates.typescript.templates["existing-template"];
      expect(template.alias).toBe("ext");
      expect(template.packageManager).toBe("npm");
    });

    it("should rename a template using --new-name", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [
          CLI_PATH,
          "config",
          "--template",
          "typescript",
          "existing-template",
          "--new-name",
          "renamed-template",
        ],
        { all: true },
      );

      const updatedConfig = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );

      expect(exitCode).toBe(0);
      expect(all).toContain(
        "Template 'existing-template' updated to 'renamed-template' successfully!",
      );
      expect(
        updatedConfig.templates.typescript.templates["existing-template"],
      ).toBeUndefined();
      expect(
        updatedConfig.templates.typescript.templates["renamed-template"],
      ).toBeDefined();
    });

    it("should update a global template when --global flag is used", async () => {
      const globalConfigPath = path.join(
        globalConfigDir,
        GLOBAL_CONFIG_FILE_NAME,
      );
      await fs.writeJson(globalConfigPath, baseLocalConfig);

      const { exitCode, all } = await execa(
        "bun",
        [
          CLI_PATH,
          "config",
          "--template",
          "typescript",
          "existing-template",
          "--alias",
          "ext-global",
          "--global",
        ],
        { all: true, env: { HOME: globalConfigDir } },
      );

      const globalConfigContent = await fs.readJson(globalConfigPath);

      expect(exitCode).toBe(0);
      expect(all).toContain("Template 'existing-template' updated successfully!");
      const template =
        globalConfigContent.templates.typescript.templates[
        "existing-template"
        ];
      expect(template.alias).toBe("ext-global");
    });

    it("should show an error for an invalid template name", async () => {
      const { exitCode, all } = await execa(
        "bun",
        [
          CLI_PATH,
          "config",
          "--template",
          "typescript",
          "non-existent-template",
          "--alias",
          "fail",
        ],
        { all: true, reject: false },
      );

      expect(exitCode).not.toBe(0);
      expect(all).toContain(
        "Template 'non-existent-template' not found in configuration.",
      );
    });
  });
});
