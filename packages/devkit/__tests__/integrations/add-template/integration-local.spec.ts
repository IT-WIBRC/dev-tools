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
  ProgrammingLanguage,
} from "../common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const jsLang = ProgrammingLanguage.Javascript.toLowerCase();

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;

const baseLocalConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    [jsLang]: {
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
  tempDir = path.join(os.tmpdir(), `devkit-test-${Date.now()}`);
  await fs.ensureDir(tempDir);
  process.chdir(tempDir);

  await fs.ensureDir(path.join(tempDir, "templates/valid-local-path"));
  await fs.ensureDir(path.join(tempDir, "templates/other-template"));

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

describe("dk add-template - Local Paths", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await teardownTestEnvironment();
  });

  it("should successfully add a new template with a relative path", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);

    const relativePath = "./templates/valid-local-path";
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "local-relative",
        "--description",
        "A relative path template",
        "--location",
        relativePath,
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'local-relative' added successfully!");
    expect(updatedConfig.templates[jsLang].templates["local-relative"]).toEqual(
      {
        description: "A relative path template",
        location: relativePath,
      },
    );
  });

  it("should successfully add a new template with a Unix absolute path", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);

    const absolutePath = path.join(tempDir, "templates/other-template");

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "local-absolute",
        "--description",
        "An absolute path template",
        "--location",
        absolutePath,
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'local-absolute' added successfully!");
    expect(updatedConfig.templates[jsLang].templates["local-absolute"]).toEqual(
      {
        description: "An absolute path template",
        location: absolutePath,
      },
    );
  });

  it("should successfully add a new template with a Windows absolute path", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);

    const windowsAbsolutePath = "C:\\projects\\my-template";
    await fs.ensureDir(windowsAbsolutePath);

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "local-windows",
        "--description",
        "A Windows path template",
        "--location",
        windowsAbsolutePath,
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'local-windows' added successfully!");
    expect(updatedConfig.templates[jsLang].templates["local-windows"]).toEqual({
      description: "A Windows path template",
      location: windowsAbsolutePath,
    });
    await fs.remove(windowsAbsolutePath);
  });

  it("should fail gracefully if a local path does not exist", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);

    const nonexistentPath = "./nonexistent-template";

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "nonexistent-local",
        "--description",
        "Test for non-existent path",
        "--location",
        nonexistentPath,
      ],
      { all: true, env: { HOME: globalConfigDir }, reject: false },
    );

    const expectedErrorMessage = `Local path not found: ${path.join(tempDir, nonexistentPath)}`;

    expect(exitCode).toBe(1);
    expect(all).toContain(expectedErrorMessage);
  });
});
