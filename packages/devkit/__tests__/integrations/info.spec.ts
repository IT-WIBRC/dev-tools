import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import path from "path";
import os from "os";
import {
  CLI_PATH,
  fs,
  CONFIG_FILE_NAMES,
  execute,
  type CliConfig,
  defaultCliConfig,
} from "./common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

const mockConfig: CliConfig = {
  ...defaultCliConfig,
  settings: {
    ...defaultCliConfig.settings,
    language: "en",
    defaultPackageManager: "npm",
    cacheStrategy: "always-refresh",
  },
  templates: {
    javascript: {
      templates: {
        basic: {
          description: "basic js template",
          location: "http://a",
          alias: "b",
        },
      },
    },
  },
};

const invalidConfig: Partial<CliConfig> = {
  ...defaultCliConfig,
  settings: {
    ...defaultCliConfig.settings,
    defaultPackageManager: "invalid-pm" as any,
  },
} as any;

const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createPaddedRegex = (label: string, value: string) => {
  const escapedLabel = escapeRegex(label);
  const escapedValue = escapeRegex(value);

  return new RegExp(`${escapedLabel}\\s*:\\s*${escapedValue}`);
};

const MOCKED_GLOBAL_HOME_DIR = path.join(
  os.tmpdir(),
  `devkit-test-info-global-${Date.now()}`,
);

let tempDir: string;
let originalCwd: string;
let globalConfigPath: string;

const MOCKED_SHELL_PATH = "/bin/bash";
describe("dk info", () => {
  beforeAll(async () => {
    vi.unmock("#utils/shell.js");
    await fs.ensureDir(MOCKED_GLOBAL_HOME_DIR);
    globalConfigPath = path.join(
      MOCKED_GLOBAL_HOME_DIR,
      GLOBAL_CONFIG_FILE_NAME,
    );
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-info-local-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);

    if (await fs.pathExists(globalConfigPath)) {
      await fs.remove(globalConfigPath);
    }
  });

  afterAll(async () => {
    await fs.remove(MOCKED_GLOBAL_HOME_DIR);
  });

  it("should display system info and report no config files found (default case)", async () => {
    const { all, exitCode } = await execute("bun", [CLI_PATH, "info"], {
      all: true,
      env: {
        HOME: MOCKED_GLOBAL_HOME_DIR,
        SHELL: MOCKED_SHELL_PATH,
      },
    });

    const EXPECTED_NOT_FOUND = "[NOT FOUND]";
    const EXPECTED_GLOBAL_LOCATION = `in your home directory ${EXPECTED_NOT_FOUND}`;
    const EXPECTED_LOCAL_LOCATION = `in the current working directory ${EXPECTED_NOT_FOUND}`;

    expect(exitCode).toBe(0);

    expect(all).toContain("System information collected.");
    expect(all).toContain("--- Scaffolder CLI ---");

    expect(all).toMatch(/Version\s*:\s*\d+\.\d+\.\d+/);
    expect(all).toContain("--- Runtime Environment ---");
    expect(all).toContain("Runtime");
    expect(all).toContain("Runtime Version");
    expect(all).toContain("Package Manager");

    expect(all).toContain("--- Configuration Files ---");

    expect(all).toMatch(
      createPaddedRegex("Global Config Path", EXPECTED_GLOBAL_LOCATION),
    );
    expect(all).toMatch(
      createPaddedRegex("Local Config Path", EXPECTED_LOCAL_LOCATION),
    );
  });

  it("should report FOUND for both local and global config files when they exist", async () => {
    await fs.writeJson(globalConfigPath, mockConfig);

    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, mockConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "info"], {
      all: true,
      env: { HOME: MOCKED_GLOBAL_HOME_DIR },
    });

    const EXPECTED_FOUND = "[FOUND]";

    const expectedGlobalPathValue = `${globalConfigPath} ${EXPECTED_FOUND}`;
    const expectedLocalPathValue = `${localConfigPath} ${EXPECTED_FOUND}`;

    expect(exitCode).toBe(0);
    expect(all).toContain("--- Configuration Files ---");

    expect(all).toMatch(
      createPaddedRegex("Global Config Path", expectedGlobalPathValue),
    );
    expect(all).toMatch(
      createPaddedRegex("Local Config Path", expectedLocalPathValue),
    );
  });

  it("should display active configuration properties (Local config only)", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, mockConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "info"], {
      all: true,
      env: { HOME: MOCKED_GLOBAL_HOME_DIR },
    });

    expect(exitCode).toBe(0);
    const EXPECTED_FOUND = "[FOUND]";
    expect(all).toMatch(
      createPaddedRegex(
        "Local Config Path",
        `${localConfigPath} ${EXPECTED_FOUND}`,
      ),
    );
  });

  it("should report validation failure and exit with code 1 if a config file is invalid", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, invalidConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "info"], {
      all: true,
      env: { HOME: MOCKED_GLOBAL_HOME_DIR },
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(all).toContain("Configuration validation failed.");
    expect(all).toContain(
      "The value for setting 'defaultPackageManager' is invalid",
    );
  });

  it("should report FOUND for local and NOT FOUND for global config", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, mockConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "in"], {
      all: true,
      env: { HOME: MOCKED_GLOBAL_HOME_DIR },
    });

    const EXPECTED_FOUND = "[FOUND]";
    const EXPECTED_NOT_FOUND = "[NOT FOUND]";

    const expectedGlobalLocation = `in your home directory ${EXPECTED_NOT_FOUND}`;
    const expectedLocalPathValue = `${localConfigPath} ${EXPECTED_FOUND}`;

    expect(exitCode).toBe(0);
    expect(all).toContain("--- Configuration Files ---");

    expect(all).toMatch(
      createPaddedRegex("Global Config Path", expectedGlobalLocation),
    );
    expect(all).toMatch(
      createPaddedRegex("Local Config Path", expectedLocalPathValue),
    );
  });
});
