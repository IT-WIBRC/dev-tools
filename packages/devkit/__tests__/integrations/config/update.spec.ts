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
let localTemplatePath: string;
let globalTemplatePath: string;

const createLocalTemplateFiles = async () => {
  await fs.ensureDir(localTemplatePath);
  await fs.ensureDir(path.join(localTemplatePath, "javascript"));
  await fs.writeFile(
    path.join(localTemplatePath, "javascript", "react-ts.txt"),
    "This is a dummy react-ts template.",
  );
  await fs.writeFile(
    path.join(localTemplatePath, "javascript", "vue-basic.txt"),
    "This is a dummy vue-basic template.",
  );
};

const createGlobalTemplateFiles = async () => {
  await fs.ensureDir(globalTemplatePath);
  await fs.ensureDir(path.join(globalTemplatePath, "javascript"));
  await fs.writeFile(
    path.join(globalTemplatePath, "javascript", "react-ts.txt"),
    "This is a dummy global react-ts template.",
  );
};

describe("dk config update", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-update-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    localTemplatePath = path.join(tempDir, "templates");
    globalTemplatePath = path.join(globalConfigDir, "templates");

    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);

    await createLocalTemplateFiles();
    await createGlobalTemplateFiles();

    localConfig = {
      ...defaultCliConfig,
      templates: {
        javascript: {
          templates: {
            "react-ts": {
              description: "A React project with TypeScript",
              location: path.join(
                localTemplatePath,
                "javascript",
                "react-ts.txt",
              ),
              alias: "rt",
              packageManager: "npm",
            },
            "vue-basic": {
              description: "A basic Vue template",
              location: path.join(
                localTemplatePath,
                "javascript",
                "vue-basic.txt",
              ),
              alias: "vb",
            },
          },
        },
      },
    };

    globalConfig = {
      ...defaultCliConfig,
      templates: {
        javascript: {
          templates: {
            "react-ts": {
              description: "A global React template",
              location: path.join(
                globalTemplatePath,
                "javascript",
                "react-ts.txt",
              ),
              alias: "rt-global",
            },
          },
        },
      },
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should update a single template in the local config", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "react-ts",
        "-d",
        "An updated React template",
        "-a",
        "rts",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 1 (react-ts) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("An updated React template");
    expect(updatedConfig.templates.javascript.templates["react-ts"].alias).toBe(
      "rts",
    );
  });

  it("should update a single template in the global config with --global flag", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "--global",
        "up",
        "javascript",
        "react-ts",
        "-d",
        "An updated global React template",
        "-a",
        "rts-global",
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 1 (react-ts) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("An updated global React template");
    expect(updatedConfig.templates.javascript.templates["react-ts"].alias).toBe(
      "rts-global",
    );
  });

  it("should update multiple templates in the local config", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "react-ts",
        "vue-basic",
        "-d",
        "Updated description for all",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 2 (react-ts, vue-basic) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("Updated description for all");
    expect(
      updatedConfig.templates.javascript.templates["vue-basic"].description,
    ).toBe("Updated description for all");
  });

  it("should handle partial updates with some failures", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "react-ts",
        "non-existent-template",
        "-d",
        "A description that should fail for one",
      ],
      { all: true, reject: false },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Failed to update 'non-existent-template': Template 'non-existent-template' not found in configuration.",
    );
    expect(all).toContain(
      "Successfully updated 1 (react-ts, non-existent-template) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("A description that should fail for one");
  });

  it("should fail gracefully if a template is not found", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "non-existent-template",
        "-d",
        "some-description",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Failed to update 'non-existent-template': Template 'non-existent-template' not found in configuration.",
    );
  });

  it("should fail gracefully if a language is not found", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execa(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "typescript",
        "ts-template",
        "-d",
        "some-description",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Failed to update 'ts-template': Programming language 'typescript' not found in configuration",
    );
  });

  it("should fail if no template name is provided", async () => {
    const { exitCode, all } = await execa(
      "bun",
      [CLI_PATH, "config", "update", "javascript"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("error: missing required argument 'templateName'");
  });
});
