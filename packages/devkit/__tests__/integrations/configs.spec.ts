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

const CLI_PATH = path.resolve("./dist/main.js");
const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;

describe("dk config set", () => {
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
    const homedir = os.homedir();
    const globalConfigPath = path.join(homedir, GLOBAL_CONFIG_FILE_NAME);
    await fs.writeJson(globalConfigPath, defaultCliConfig, { spaces: 2 });

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "set", "language", "fr", "--global"],
      { all: true },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration updated successfully!");

    const globalConfigContent = await fs.readJson(globalConfigPath);
    expect(globalConfigContent.settings.language).toBe("fr");

    // Clean up
    await fs.remove(globalConfigPath);
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
    expect(configContent).toEqual(defaultCliConfig); // No changes made
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
    expect(configContent).toEqual(defaultCliConfig); // No changes made
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
