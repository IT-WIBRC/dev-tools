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

  it("should add a new template to the local config file (using canonical language)", async () => {
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

  it("should add a new template to the local config file using the 'js' alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const svelteTemplatePath = path.join(
      localTemplateDir,
      "javascript",
      "svelte-basic.txt",
    );
    await fs.ensureDir(svelteTemplatePath);

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "js",
        "svelte-basic",
        "-d",
        "A basic Svelte template",
        "-o",
        svelteTemplatePath,
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'svelte-basic' added successfully!");
    expect(
      updatedConfig.templates.javascript.templates["svelte-basic"],
    ).toEqual({
      description: "A basic Svelte template",
      location: svelteTemplatePath,
    });
    expect(updatedConfig.templates.js).toBeUndefined();
  });

  it("should add a new template and create the 'typescript' language section using the 'ts' alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const tsNodeTemplatePath = path.join(
      localTemplateDir,
      "typescript",
      "ts-node.txt",
    );
    await fs.ensureDir(tsNodeTemplatePath);

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "ts",
        "ts-node",
        "-d",
        "A basic TS Node template",
        "-o",
        tsNodeTemplatePath,
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Template 'ts-node' added successfully!");

    expect(updatedConfig.templates.typescript).toBeDefined();
    expect(updatedConfig.templates.typescript.templates["ts-node"]).toEqual({
      description: "A basic TS Node template",
      location: tsNodeTemplatePath,
    });
    expect(updatedConfig.templates.ts).toBeUndefined();
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

  it("should fail to add a template if the programming language language is invalid (even with alias resolution)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "invalid-lang$",
        "ts-node",
        "-d",
        "A TS project",
        "-o",
        "https://github.com/ts-project",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("Invalid value for Programming Language.");
  });

  it("should fail to add a template if it already exists (using alias to check canonical key)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "add",
        "js",
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
      "Template 'react-ts' already exists in the configuration. Use 'devkit config set' to update it.",
    );
  });

  it("should fail to add a template if a template with the same alias exists (using alias to check canonical key)", async () => {
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
        "js",
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
      "Alias 'rt' already exists for another template in this language. Please choose a different alias.",
    );
  });
});
