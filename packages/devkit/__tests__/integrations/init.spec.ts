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
  type CliConfig,
  defaultCliConfig,
  execute,
} from "./common.js";

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
      language: "en",
      cacheStrategy: "always-refresh",
      defaultPackageManager: "npm",
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
      defaultPackageManager: "bun",
    },
  };
  await fs.writeJson(
    path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    globalConfig,
  );
};

const INPUT_ENTER = "\n";
const INPUT_DOWN_ARROW = "\x1B[B";

const INPUT_YES_SIMULATED = INPUT_ENTER;
const INPUT_NO_SIMULATED = INPUT_DOWN_ARROW + INPUT_ENTER;

describe("dk config", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );

    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);

    vi.spyOn(os, "homedir").mockReturnValue(globalConfigDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  describe("INIT Functionality (Creating Config)", () => {
    const SUCCESS_MESSAGE = "Configuration initialized successfully!";
    const ABORTED_MESSAGE = "Operation aborted. No changes were made.";
    const SKIP_YES_MESSAGE_FRAGMENT =
      "Skipping confirmation: Overwriting config file at";

    describe("Interactive Init (No --yes)", () => {
      it("should create a local config file when none exists (default behavior)", async () => {
        const localPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

        expect(await fs.pathExists(localPath)).toBe(false);

        const { all, exitCode } = await execute("bun", [CLI_PATH, "init"], {
          all: true,
        });

        expect(exitCode).toBe(0);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(await fs.pathExists(localPath)).toBe(true);
      });

      it("should prompt and successfully overwrite an existing local config file when 'yes' is selected (simulated input)", async () => {
        await createLocalConfig();
        const localPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

        const { all, exitCode } = await execute("bun", [CLI_PATH, "init"], {
          all: true,
          input: INPUT_YES_SIMULATED,
        });
        const finalConfig = await fs.readJson(localPath);

        expect(exitCode).toBe(0);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(all).toContain(path.basename(localPath));
        expect(finalConfig.settings.language).not.toBe("old");
      });

      it("should prompt and abort initialization when 'no' is selected for local config overwrite (simulated input)", async () => {
        await createLocalConfig();
        const localPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

        const { all, exitCode } = await execute("bun", [CLI_PATH, "init"], {
          all: true,
          input: INPUT_NO_SIMULATED,
        });
        const finalConfig = await fs.readJson(localPath);

        expect(exitCode).toBe(0);
        expect(all).toContain(ABORTED_MESSAGE);
        expect(all).toContain(path.basename(localPath));
        expect(finalConfig.settings.language).toBe("en");
      });

      it("should prompt and successfully overwrite an existing global config file when --global is used and 'yes' is selected (simulated input)", async () => {
        await createGlobalConfig();
        const globalPath = path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME);

        const { all, exitCode } = await execute(
          "bun",
          [CLI_PATH, "init", "--global"],
          {
            all: true,
            env: { HOME: globalConfigDir },
            input: INPUT_YES_SIMULATED,
          },
        );
        const finalConfig = await fs.readJson(globalPath);

        expect(exitCode).toBe(0);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(all).toContain(path.basename(globalPath));
        expect(finalConfig.settings.language).not.toBe("old");
      });
    });

    describe("Non-Interactive Init (With --yes)", () => {
      it("should create a new local config file silently with --yes (no prompt, no existing file)", async () => {
        const localPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

        expect(await fs.pathExists(localPath)).toBe(false);

        const { all, exitCode } = await execute(
          "bun",
          [CLI_PATH, "init", "--yes"],
          { all: true },
        );

        expect(exitCode).toBe(0);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(await fs.pathExists(localPath)).toBe(true);
        expect(all).not.toContain(SKIP_YES_MESSAGE_FRAGMENT);
      });

      it("should automatically overwrite an existing local config file with --yes (no prompt, success)", async () => {
        await createLocalConfig();
        const localPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

        const { all, exitCode } = await execute(
          "bun",
          [CLI_PATH, "init", "-y"],
          { all: true },
        );
        const finalConfig = await fs.readJson(localPath);

        expect(exitCode).toBe(0);
        expect(all).toContain(SKIP_YES_MESSAGE_FRAGMENT);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(finalConfig.settings.language).not.toBe("old");
      });

      it("should automatically overwrite an existing global config file with --global and --yes", async () => {
        await createGlobalConfig();
        const globalPath = path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME);

        const { all, exitCode } = await execute(
          "bun",
          [CLI_PATH, "init", "--global", "-y"],
          { all: true, env: { HOME: globalConfigDir } },
        );
        const finalConfig = await fs.readJson(globalPath);

        expect(exitCode).toBe(0);
        expect(all).toContain(SKIP_YES_MESSAGE_FRAGMENT);
        expect(all).toContain(SUCCESS_MESSAGE);
        expect(finalConfig.settings.language).not.toBe("old");
      });
    });
  });

  describe("Core Behavior", () => {
    it("should warn the user when no command or option is provided", async () => {
      const { all, exitCode } = await execute("bun", [CLI_PATH, "config"], {
        all: true,
        reject: false,
      });

      expect(exitCode).toBe(0);
      expect(all).toContain(
        "Warning: No command or option provided. Use `dk config --help` to see available commands.",
      );
    });

    it("should throw an error if no config file is found for setting", async () => {
      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "conf", "--set", "lang", "en"],
        { all: true, reject: false },
      );

      expect(exitCode).toBe(1);
      expect(all).toContain(
        "::[DEV]>> Devkit encountered an unexpected internal issue: No local configuration file found. Run 'devkit config init --local' to create one.",
      );
    });
  });
});
