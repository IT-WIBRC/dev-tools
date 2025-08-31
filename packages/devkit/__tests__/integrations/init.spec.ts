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

let tempDir: string;
let originalCwd: string;

describe("dk init", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it("should create a local config file in a bare directory", async () => {
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    const configPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const fileExists = await fs.pathExists(configPath);
    expect(fileExists).toBe(true);
    const configContent = await fs.readJson(configPath);
    expect(configContent).toEqual(defaultCliConfig);
  });

  it("should create a global config file when --global flag is used", async () => {
    const homedir = os.homedir();
    const globalConfigPath = path.join(homedir, CONFIG_FILE_NAMES[0]);

    if (await fs.pathExists(globalConfigPath)) {
      await fs.remove(globalConfigPath);
    }

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "init", "--global"],
      { all: true },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    const fileExists = await fs.pathExists(globalConfigPath);
    expect(fileExists).toBe(true);

    await fs.remove(globalConfigPath);
  });
});

describe("dk init with existing file", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  const basicConfig: CliConfig = {
    templates: {},
    settings: {
      defaultPackageManager: "bun",
      cacheStrategy: "daily",
      language: "en",
    },
  };

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.writeJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      basicConfig,
      {
        spaces: 2,
      },
    );
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it("should not overwrite the file if user selects 'no'", async () => {
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      input: "\u001b[B\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Operation aborted.");
    const newContent = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      "utf-8",
    );
    expect(newContent).toEqual(basicConfig);
  });

  it("should overwrite the file if user selects 'yes'", async () => {
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    const newContent = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      "utf-8",
    );
    expect(newContent).not.toEqual(basicConfig);
    expect(newContent).toEqual(defaultCliConfig);
  });
});

describe("dk init in a monorepo", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-monorepo-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);

    await fs.writeJson(path.join(tempDir, "package.json"), {
      private: true,
      workspaces: ["packages/*"],
    });

    const nestedPackagePath = path.join(tempDir, "packages", "my-app");
    await fs.ensureDir(nestedPackagePath);
    await fs.writeJson(path.join(nestedPackagePath, "package.json"), {
      name: "my-app",
    });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it("should create a config in the monorepo root when the user selects 'root'", async () => {
    const nestedPackagePath = path.join(tempDir, "packages", "my-app");
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: nestedPackagePath,
      input: "\u001b[B\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const fileExists = await fs.pathExists(rootConfigPath);
    expect(fileExists).toBe(true);
    const configContent = await fs.readJson(rootConfigPath);
    expect(configContent).toEqual(defaultCliConfig);

    const nestedConfigPath = path.join(
      nestedPackagePath,
      LOCAL_CONFIG_FILE_NAME,
    );
    const nestedFileExists = await fs.pathExists(nestedConfigPath);
    expect(nestedFileExists).toBe(false);
  });

  it("should create a config in the current package when the user selects 'local'", async () => {
    const nestedPackagePath = path.join(tempDir, "packages", "my-app");
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: nestedPackagePath,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    const nestedConfigPath = path.join(
      nestedPackagePath,
      LOCAL_CONFIG_FILE_NAME,
    );
    const fileExists = await fs.pathExists(nestedConfigPath);
    expect(fileExists).toBe(true);
    const configContent = await fs.readJson(nestedConfigPath);
    expect(configContent).toEqual(defaultCliConfig);

    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootFileExists = await fs.pathExists(rootConfigPath);
    expect(rootFileExists).toBe(false);
  });

  it("should overwrite the root config when running the command from the root and user confirms", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { defaultPackageManager: "yarn" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent, { spaces: 2 });

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: tempDir,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");

    const newContent = await fs.readJson(rootConfigPath);
    expect(newContent).toEqual(defaultCliConfig);
  });

  it("should not overwrite the root config when running the command from the root and user declines", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { defaultPackageManager: "yarn" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent, { spaces: 2 });

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: tempDir,
      input: "\u001b[B\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Operation aborted.");

    const newContent = await fs.readJson(rootConfigPath);
    expect(newContent).toEqual(rootConfigContent);
  });

  it("should create a new local config in a sub-package if a root config exists and user confirms", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { language: "en" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent, { spaces: 2 });

    const nestedPackagePath = path.join(tempDir, "packages", "my-app");
    const nestedConfigPath = path.join(
      nestedPackagePath,
      LOCAL_CONFIG_FILE_NAME,
    );

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: nestedPackagePath,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("✔ Configuration file created successfully!");
    expect(all).toContain(
      `A config file exists in the monorepo root at ${rootConfigPath}. Do you want to create a new one in the current package?`,
    );

    const newRootContent = await fs.readJson(rootConfigPath);
    expect(newRootContent).toEqual(rootConfigContent);

    const nestedFileExists = await fs.pathExists(nestedConfigPath);
    expect(nestedFileExists).toBe(true);

    const nestedConfigContent = await fs.readJson(nestedConfigPath);
    expect(nestedConfigContent).toEqual(defaultCliConfig);
  });

  it("should not create a local config if a root config exists and user declines overwrite", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { language: "en" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent, { spaces: 2 });

    const nestedPackagePath = path.join(tempDir, "packages", "my-app");
    const nestedConfigPath = path.join(
      nestedPackagePath,
      LOCAL_CONFIG_FILE_NAME,
    );

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: nestedPackagePath,
      input: "\u001b[B\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Operation aborted.");

    const newRootContent = await fs.readJson(rootConfigPath);
    expect(newRootContent).toEqual(rootConfigContent);

    const nestedFileExists = await fs.pathExists(nestedConfigPath);
    expect(nestedFileExists).toBe(false);
  });
});
