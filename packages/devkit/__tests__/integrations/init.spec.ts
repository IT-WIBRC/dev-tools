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
  defaultCliConfig as schemaDefaultCliConfig,
  type CliConfig,
  SCHEMA_PATH,
} from "./common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const defaultCliConfig = {
  $schema: SCHEMA_PATH,
  ...schemaDefaultCliConfig,
};

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
    process.env.HOME = os.tmpdir();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);

    delete process.env.HOME;
  });

  it("should create a local config file in a bare directory", async () => {
    process.env.HOME = tempDir;
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      env: { HOME: tempDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration file created successfully!");
    const configPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

    const fileExists = await fs.pathExists(configPath);
    expect(fileExists).toBe(true);
    const configContent = await fs.readJson(configPath);
    expect(configContent).toEqual(defaultCliConfig);

    await fs.remove(configPath);
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
    expect(all).toContain("Configuration file created successfully!");
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

  let rootConfigPath = "";
  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);

    process.chdir(tempDir);
    process.env.HOME = os.tmpdir();
    await fs.writeJson(rootConfigPath, basicConfig);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);

    delete process.env.HOME;
  });

  it("should prompt for override the existing global config when --global flag is used and there is already an existing config file", async () => {
    const homedir = os.homedir();
    const globalConfigPath = path.join(homedir, CONFIG_FILE_NAMES[0]);

    if (!(await fs.pathExists(globalConfigPath))) {
      await fs.writeJson(globalConfigPath, {
        ...defaultCliConfig,
        settings: {
          ...defaultCliConfig.settings,
          cacheStrategy: "always-refresh",
        },
      });
    }

    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "init", "--global"],
      {
        all: true,
        input: "\n",
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      `Config file already exists at ${globalConfigPath}. Do you want to overwrite it?`,
    );

    expect(all).toContain("Configuration file created successfully!");
    const fileExists = await fs.pathExists(globalConfigPath);
    expect(fileExists).toBe(true);

    const newGlobalConfig = await fs.readJson(globalConfigPath);
    expect(newGlobalConfig).toEqual(defaultCliConfig);

    await fs.remove(globalConfigPath);
  });

  it("should not overwrite the file if user selects 'no'", async () => {
    const initialContent = await fs.readJson(rootConfigPath);
    expect(initialContent).toEqual(basicConfig);

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      input: "\u001b[B\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Operation aborted.");
    const newContent = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );
    expect(newContent).toEqual(basicConfig);
  });

  it("should overwrite the file if user selects 'yes'", async () => {
    const initialContent = await fs.readJson(rootConfigPath);
    expect(initialContent).toEqual(basicConfig);

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration file created successfully!");
    const newContent = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );
    expect(newContent).not.toEqual(basicConfig);
    expect(newContent).toEqual(defaultCliConfig);
  });

  describe("In a sub directory", () => {
    it("should ask to override at the root and if `yes`, override", async () => {
      const initialContent = await fs.readJson(rootConfigPath);
      expect(initialContent).toEqual(basicConfig);

      const subDirectory = path.join(tempDir, "src", "utils");
      await fs.ensureDir(subDirectory);

      const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
        all: true,
        input: "\n",
      });

      expect(exitCode).toBe(0);
      expect(all).toContain(`Config file already exists at ${rootConfigPath}`);

      expect(all).toContain("Configuration file created successfully!");
      const newContent = await fs.readJson(rootConfigPath);

      expect(newContent).not.toEqual(basicConfig);
      expect(newContent).toEqual(defaultCliConfig);
    });
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
    await fs.ensureDir(path.join(tempDir, "node_modules"));
    process.chdir(tempDir);

    process.env.HOME = tempDir;

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
    delete process.env.HOME;
  });

  it("should create a config in the monorepo root", async () => {
    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: tempDir,
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration file created successfully!");
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const fileExists = await fs.pathExists(rootConfigPath);
    expect(fileExists).toBe(true);
    const configContent = await fs.readJson(rootConfigPath);
    expect(configContent).toEqual(defaultCliConfig);
  });

  it("should overwrite the root config when the user confirms", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { defaultPackageManager: "yarn" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent);

    const initialContent = await fs.readJson(rootConfigPath);
    expect(initialContent).toEqual(rootConfigContent);

    const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
      all: true,
      cwd: tempDir,
      input: "\n",
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration file created successfully!");

    const newContent = await fs.readJson(rootConfigPath);
    expect(newContent).toEqual(defaultCliConfig);
  });

  it("should not overwrite the root config when the user declines", async () => {
    const rootConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    const rootConfigContent = {
      settings: { defaultPackageManager: "yarn" },
    };
    await fs.writeJson(rootConfigPath, rootConfigContent);

    const initialContent = await fs.readJson(rootConfigPath);
    expect(initialContent).toEqual(rootConfigContent);

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

  describe("In a package", () => {
    it("should ask to override at the root even if inside a package and if `yes`, override", async () => {
      const nestedPackagePath = path.join(tempDir, "packages", "my-app");
      const { all, exitCode } = await execa("bun", [CLI_PATH, "init"], {
        all: true,
        cwd: nestedPackagePath,
      });

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration file created successfully!");
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
  });
});
