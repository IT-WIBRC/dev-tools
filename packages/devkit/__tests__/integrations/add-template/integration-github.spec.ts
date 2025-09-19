import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
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
  templates: {},
};

vi.mock("execa", async (importOriginal) => {
  const actual = await importOriginal<typeof import("execa")>();
  return {
    ...actual,
    execa: vi.fn((command, args, options) => {
      if (command === "git") {
        if (args.includes("dev-tools")) {
          return Promise.resolve({ exitCode: 0, all: "Success" });
        } else {
          return Promise.resolve({ exitCode: 128, all: "repo not found" });
        }
      }
      return actual.execa(command, args, options);
    }),
  };
});

async function setupTestEnvironment(): Promise<void> {
  originalCwd = process.cwd();
  tempDir = path.join(os.tmpdir(), `devkit-test-${Date.now()}`);
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

describe("dk add-template - GitHub URL (consistent mocking)", () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await teardownTestEnvironment();
  });

  it.skip("should successfully add a new template with a valid GitHub URL", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);
    const githubUrl = "git@github.com:IT-WIBRC/dev-tools.git";

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "react-app-cli",
        "--description",
        "A React template via CLI options",
        "--location",
        githubUrl,
      ],
      { all: true, env: { ...process.env, HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(localConfigPath);

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'react-app-cli' added successfully!");
    expect(updatedConfig.templates[jsLang].templates["react-app-cli"]).toEqual({
      description: "A React template via CLI options",
      location: githubUrl,
    });
  });

  it("should fail gracefully for an invalid GitHub URL", async () => {
    const localConfigPath = path.join(tempDir, LOCAL_CONFIG_FILE_NAME);
    await fs.writeJson(localConfigPath, baseLocalConfig);
    const invalidGithubUrl = "git@github.com:IT-WIBRC/non-existent-repo.git";

    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "add-template",
        "--language",
        jsLang,
        "--name",
        "invalid-github",
        "--description",
        "A test for an invalid GitHub URL",
        "--location",
        invalidGithubUrl,
      ],
      {
        all: true,
        env: { ...process.env, HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("Invalid or inaccessible GitHub repository URL:");
  });
});
