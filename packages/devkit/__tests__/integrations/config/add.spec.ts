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
} from "../common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;
let localTemplateDir: string;
let globalTemplateDir: string;
let localConfig: CliConfig;
let globalConfig: CliConfig;

const createLocalTemplateFiles = async () => {
  await fs.ensureDir(localTemplateDir);
  await fs.ensureDir(path.join(localTemplateDir, "javascript"));
  await fs.writeFile(
    path.join(localTemplateDir, "javascript", "react-ts.txt"),
    "This is a dummy react-ts template.",
  );
};

const createGlobalTemplateFiles = async () => {
  await fs.ensureDir(globalTemplateDir);
  await fs.ensureDir(path.join(globalTemplateDir, "javascript"));
  await fs.writeFile(
    path.join(globalTemplateDir, "javascript", "react-ts.txt"),
    "This is a dummy global react-ts template.",
  );
};

describe("dk config add", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-add-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    localTemplateDir = path.join(tempDir, "templates");
    globalTemplateDir = path.join(globalConfigDir, "templates");

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
                localTemplateDir,
                "javascript",
                "react-ts.txt",
              ),
              alias: "rt",
              packageManager: "npm",
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
              description: "A React project with TypeScript",
              location: path.join(
                globalTemplateDir,
                "javascript",
                "react-ts.txt",
              ),
              alias: "rt",
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

  it("should add a new template to the local config file", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const vueTemplatePath = path.join(
      localTemplateDir,
      "javascript",
      "vue-basic.txt",
    );
    await fs.ensureDir(vueTemplatePath);

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "javascript",
        "vue-basic",
        "-d",
        "A basic Vue template",
        "-o",
        vueTemplatePath,
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'vue-basic' added successfully!");
    expect(updatedConfig.templates.javascript.templates["vue-basic"]).toEqual({
      description: "A basic Vue template",
      location: vueTemplatePath,
    });
  });

  it("should add a new template to the global config with --global flag", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );
    const vueTemplatePath = path.join(
      globalTemplateDir,
      "javascript",
      "vue-basic.txt",
    );
    await fs.ensureDir(vueTemplatePath);

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "--global",
        "add",
        "javascript",
        "vue-basic",
        "-d",
        "A basic Vue template",
        "-o",
        vueTemplatePath,
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'vue-basic' added successfully!");
    expect(updatedConfig.templates.javascript.templates["vue-basic"]).toEqual({
      description: "A basic Vue template",
      location: vueTemplatePath,
    });
  });

  it("should fail to add a template if required options are missing", async () => {
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "add", "javascript", "vue-basic"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Please provide all of the following: --description, --location.",
    );
  });

  it("should fail to add a template if a language is not found", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "typescript",
        "ts-node",
        "-d",
        "A TS project",
        "-o",
        "https://github.com/ts-project",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Invalid value for language. Valid options are: javascript",
    );
  });

  it("should fail to add a template if it already exists", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "javascript",
        "react-ts",
        "-d",
        "A React project with TypeScript",
        "-o",
        path.join(localTemplateDir, "javascript", "react-ts.txt"),
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Template 'react-ts' already exists in the configuration. Use 'devkit config set' to update it.",
    );
  });

  it("should fail to add a template if a template with the same alias exists", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const location = path.join(
      localTemplateDir,
      "javascript",
      "new-ts-template.txt",
    );
    await fs.ensureDir(location);

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "javascript",
        "new-ts-template",
        "-d",
        "A new TS project",
        "-o",
        location,
        "-a",
        "rt",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "An unexpected error occurred: Alias 'rt' already exists for another template in this language. Please choose a different alias.",
    );
  });
});
