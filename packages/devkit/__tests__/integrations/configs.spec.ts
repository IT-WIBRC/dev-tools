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
} from "../../src/utils/configs/schema.js";

const CLI_PATH = path.resolve("./dist/bundle.js");
const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;

describe("dk config commands", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-set-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.writeJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      defaultCliConfig,
      { spaces: 2 },
    );
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe("dk config set", () => {
    it("should set a single config value in settings correctly", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "pm", "bun"],
        { all: true },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration updated successfully!");

      const configContent = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );
      expect(configContent.settings.defaultPackageManager).toBe("bun");
    });

    it("should set multiple config values in settings correctly", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "pm", "yarn", "language", "fr"],
        { all: true },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration updated successfully!");

      const configContent = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );
      expect(configContent.settings.defaultPackageManager).toBe("yarn");
      expect(configContent.settings.language).toBe("fr");
    });

    it("should update a global config file when --global flag is used", async () => {
      const tempGlobalHome = path.join(
        os.tmpdir(),
        `global-home-${Date.now()}`,
      );
      await fs.ensureDir(tempGlobalHome);
      const globalConfigPath = path.join(
        tempGlobalHome,
        GLOBAL_CONFIG_FILE_NAME,
      );
      await fs.writeJson(globalConfigPath, defaultCliConfig, { spaces: 2 });

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "language", "fr", "--global"],
        { all: true, env: { HOME: tempGlobalHome } },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration updated successfully!");

      const globalConfigContent = await fs.readJson(globalConfigPath);
      expect(globalConfigContent.settings.language).toBe("fr");

      await fs.remove(tempGlobalHome);
    });

    it("should show an error for an invalid key", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "invalid_key", "value"],
        { all: true, reject: false },
      );

      expect(exitCode).not.toBe(0);
      expect(all).toContain(
        "An unexpected error occurred: Invalid key: 'invalid_key'. Valid keys are: pm, packageManager, cache, cacheStrategy, language, lg",
      );
      const configContent = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );
      expect(configContent).toEqual(defaultCliConfig);
    });

    it("should show an error for an invalid value", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "language", "de"],
        { all: true, reject: false },
      );

      expect(exitCode).not.toBe(0);
      expect(all).toContain(
        "An unexpected error occurred: Invalid value for language. Valid options are: en, fr",
      );
      const configContent = await fs.readJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      );
      expect(configContent).toEqual(defaultCliConfig);
    });

    it("should show an error for a non-existent config file", async () => {
      await fs.remove(path.join(tempDir, LOCAL_CONFIG_FILE_NAME));

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "set", "pm", "bun"],
        { all: true, reject: false },
      );

      expect(exitCode).not.toBe(0);
      expect(all).toContain("No configuration file found.");
    });
  });

  describe("dk config get", () => {
    it("should get a single value from the local config", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "language"],
        { all: true },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain("Using local configuration.");
      expect(all).toContain("language: en");
    });

    it("should get a value using an alias", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "pm"],
        { all: true },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain("defaultPackageManager: bun");
    });

    it("should show an error for a non-existent key", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "invalid-key"],
        { all: true, reject: false },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration key 'invalid-key' not found.");
    });

    it("should get the entire local config if no key is specified", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get"],
        {
          all: true,
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain("Using local configuration.");
      expect(all).toContain('"language": "en"');
      expect(all).toContain('"defaultPackageManager": "bun"');
    });

    it("should get a value from the global config when --global is used", async () => {
      const tempGlobalHome = path.join(
        os.tmpdir(),
        `global-home-${Date.now()}`,
      );
      await fs.ensureDir(tempGlobalHome);
      const globalConfigPath = path.join(
        tempGlobalHome,
        GLOBAL_CONFIG_FILE_NAME,
      );
      await fs.writeJson(
        globalConfigPath,
        {
          ...defaultCliConfig,
          settings: { ...defaultCliConfig.settings, language: "fr" },
        },
        { spaces: 2 },
      );

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "language", "--global"],
        { all: true, env: { HOME: tempGlobalHome } },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain("Using global configuration.");
      expect(all).toContain("language: fr");

      await fs.remove(tempGlobalHome);
    });

    it("should fallback to global config if local is not present", async () => {
      await fs.remove(path.join(tempDir, LOCAL_CONFIG_FILE_NAME));

      const tempGlobalHome = path.join(
        os.tmpdir(),
        `global-home-${Date.now()}`,
      );
      await fs.ensureDir(tempGlobalHome);
      const globalConfigPath = path.join(
        tempGlobalHome,
        GLOBAL_CONFIG_FILE_NAME,
      );
      await fs.writeJson(globalConfigPath, {
        ...defaultCliConfig,
        settings: {
          ...defaultCliConfig.settings,
          defaultPackageManager: "yarn",
        },
      });

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "pm"],
        { all: true, env: { HOME: tempGlobalHome } },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain(
        "No local configuration file found. Displaying global settings instead.",
      );
      expect(all).toContain("defaultPackageManager: yarn");

      await fs.remove(tempGlobalHome);
    });

    it("should show default fallback message if no config files are found", async () => {
      await fs.remove(path.join(tempDir, LOCAL_CONFIG_FILE_NAME));
      const tempGlobalHome = path.join(
        os.tmpdir(),
        `global-home-${Date.now()}`,
      );
      await fs.ensureDir(tempGlobalHome);

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "config", "get", "language"],
        { all: true, env: { HOME: tempGlobalHome } },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("✔ Configuration loaded successfully!");
      expect(all).toContain(
        "No local configuration file found. Displaying default settings instead.",
      );
      expect(all).toContain("language: en");

      await fs.remove(tempGlobalHome);
    });
  });
});
