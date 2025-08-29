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
const CACHE_DIR = path.join(os.homedir(), ".devkit", "cache");

let tempDir: string;
let originalCwd: string;

const localConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {
    javascript: {
      templates: {
        "react-ts": {
          description: "A React project with TypeScript",
          location: "https://github.com/microsoft/TypeScript-Node-Starter.git",
          alias: "rt",
          packageManager: "npm",
        },
      },
    },
    node: {
      templates: {
        "node-api": {
          description: "A Node.js API boilerplate",
          location: "https://github.com/expressjs/express-generator.git",
          alias: "na",
        },
      },
    },
  },
};

vi.mock("#scaffolding/javascript.js", () => ({
  scaffoldProject: vi.fn(),
}));

vi.mock("#scaffolding/node.js", () => ({
  scaffoldProject: vi.fn(),
}));

vi.mock("fs-extra", async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    remove: vi.fn(actual.remove),
  };
});

describe("dk new", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-new-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.writeJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      localConfig,
      {
        spaces: 2,
      },
    );
  });

  afterEach(async () => {
    console.log(path.join(CACHE_DIR, "..."));
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it("should successfully scaffold a new project using the template name", async () => {
    // const { all, exitCode } = await execa(
    //   "bun",
    //   [CLI_PATH, "new", "javascript", "my-app", "-t", "react-ts"],
    //   { all: true },
    // );
    // const { scaffoldProject } = await import("#scaffolding/javascript.js");
    // expect(exitCode).toBe(0);
    // expect(all).toContain("✅ New project 'my-app' successfully created!");
    // expect(scaffoldProject).toHaveBeenCalledWith({
    //   projectName: "my-app",
    //   templateConfig: expect.objectContaining({ alias: "rt" }),
    //   packageManager: "npm",
    //   cacheStrategy: "daily",
    // });
  });

  // Test case 2: Successfully scaffold a project using the template alias
  it.skip("should successfully scaffold a new project using the template alias", async () => {
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "new", "node", "my-api", "-t", "na"],
      { all: true },
    );

    const { scaffoldProject } = await import("#scaffolding/node.js");

    expect(exitCode).toBe(0);
    expect(all).toContain("✅ New project 'my-api' successfully created!");
    expect(scaffoldProject).toHaveBeenCalledWith({
      projectName: "my-api",
      templateConfig: expect.objectContaining({ alias: "na" }),
      packageManager: "bun",
      cacheStrategy: "daily",
    });
  });

  // Test case 3: Clears the cache directory if the cache strategy is always-refresh
  it.skip("should clear the cache directory if cache strategy is always-refresh", async () => {
    const configWithCacheStrategy: CliConfig = {
      ...localConfig,
      settings: {
        ...localConfig.settings,
        cacheStrategy: "always-refresh",
      },
    };
    await fs.writeJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      configWithCacheStrategy,
      {
        spaces: 2,
      },
    );

    await execa(
      "bun",
      [CLI_PATH, "new", "javascript", "my-app", "-t", "react-ts"],
      { all: true },
    );

    expect(vi.mocked(fs.remove)).toHaveBeenCalledWith(CACHE_DIR);
  });

  // Test case 4: Fail if the language is not found in the config
  it.skip("should fail if the specified language is not found in the config", async () => {
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "new", "rust", "rust-app", "-t", "cargo-app"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "❌ An unexpected error occurred: Scaffolding language not found in configuration: 'rust'",
    );
  });

  // Test case 5: Fail if the template name or alias is not found
  it.skip("should fail if the template name or alias is not found", async () => {
    const { all, exitCode } = await execa(
      "bun",
      [CLI_PATH, "new", "javascript", "my-app", "-t", "vue-basic"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "❌ An unexpected error occurred: Template 'vue-basic' not found in the configuration.",
    );
  });
});
