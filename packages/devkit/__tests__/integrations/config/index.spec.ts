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
  type CliConfig,
  defaultCliConfig,
} from "../common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;
let localConfig: CliConfig;
let globalConfig: CliConfig;

const createLocalConfig = async () => {
  localConfig = {
    ...defaultCliConfig,
    settings: {
      ...defaultCliConfig.settings,
      language: "fr",
      cacheStrategy: "always-refresh",
    },
  };
  await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
};

const createGlobalConfig = async () => {
  globalConfig = {
    ...defaultCliConfig,
    settings: {
      ...defaultCliConfig.settings,
      language: "en",
      cacheStrategy: "daily",
    },
  };
  await fs.writeJson(
    path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    globalConfig,
  );
};

describe("dk config", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-${Date.now()}`);
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

  it("should warn the user when no command or option is provided", async () => {
    const { all, exitCode } = await execa("bun", [CLI_PATH, "config"], {
      all: true,
      reject: false,
    });

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Warning: No command or option provided. Use `dk config --help` to see available commands.",
    );
  });

  it("should get a single setting from the local config", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "language"],
      { all: true },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("language: fr");
    expect(all).toContain("Configuration chargée avec succès !");
  });

  it("should get multiple settings from the local config", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "language", "cacheStrategy"],
      { all: true },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("language: fr");
    expect(all).toContain("cacheStrategy: always-refresh");
    expect(all).toContain("Configuration chargée avec succès !");
  });

  it("should get a setting from the global config with --global flag", async () => {
    await createGlobalConfig();
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "language", "--global"],
      { all: true, env: { HOME: globalConfigDir } },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("language: en");
    expect(all).toContain("Configuration chargée avec succès !");
  });

  it("should set a single setting in the local config", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "--set", "language", "en"],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration mise à jour avec succès !");
    expect(updatedConfig.settings.language).toBe("en");
  });

  it("should set a single setting in the global config with --global flag", async () => {
    await createGlobalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "--global", "--set", "language", "fr"],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration updated successfully!");
    expect(updatedConfig.settings.language).toBe("fr");
  });

  it("should set multiple settings in the local config", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "--set",
        "language",
        "en",
        "cacheStrategy",
        "never-refresh",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration mise à jour avec succès !");
    expect(updatedConfig.settings.language).toBe("en");
    expect(updatedConfig.settings.cacheStrategy).toBe("never-refresh");
  });

  it("should fail if --set has an odd number of arguments", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "--set", "language", "en", "invalid"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Les valeurs pour l'option '--set' doivent être une série de paires clé-valeur (par ex. --set key1 value1 key2 value2).",
    );
  });

  it("should fail gracefully if a key to get is not found", async () => {
    await createLocalConfig();
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "non_existent_key"],
      { all: true },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Clé de configuration 'non_existent_key' non trouvée.",
    );
  });

  it("should throw an error if no config file is found for setting", async () => {
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "config", "--set", "language", "en"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "n unexpected error occurred: No local configuration file found. Run 'devkit config init --local' to create one.",
    );
  });
});
