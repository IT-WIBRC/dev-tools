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

beforeAll(() => {
  vi.unmock("#utils/shell.js");
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
          "other-js": {
            description: "Another JS template",
            location: path.join(
              localTemplatePath,
              "javascript",
              "other-js.txt",
            ),
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
          "angular-js": {
            description: "A global Angular template",
            location: path.join(
              globalTemplatePath,
              "javascript",
              "angular-js.txt",
            ),
            alias: "ng-g",
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

describe("Config Update - Single and Multiple Templates", () => {
  it("should update a single template in the local config by name (canonical language)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
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

  it("should update a single template in the local config using the 'js' language alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "js",
        "react-ts",
        "-d",
        "Updated using JS alias",
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
    ).toBe("Updated using JS alias");
  });

  it("should update multiple templates in the local config", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
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
});

describe("Config Update - Wildcard and Alias Support", () => {
  it("should update a single template in the local config using its alias (canonical language)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "rt",
        "-d",
        "Updated via Alias",
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
    ).toBe("Updated via Alias");
  });

  it("should update ALL local templates using the wildcard '*' (canonical language)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "*",
        "-d",
        "Updated by Wildcard",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 3 (react-ts, vue-basic, other-js) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["other-js"].description,
    ).toBe("Updated by Wildcard");
  });

  it("should update ALL local templates using the 'js' language alias and wildcard '*'", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "js",
        "*",
        "-d",
        "Updated by JS Alias Wildcard",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 3 (react-ts, vue-basic, other-js) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["other-js"].description,
    ).toBe("Updated by JS Alias Wildcard");
  });

  it("should update templates found by '*' but warn for explicitly listed non-existent names", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "*",
        "non-existent-A",
        "non-existent-B",
        "-d",
        "Updated, ignoring unknowns",
      ],
      { all: true },
    );

    const updatedConfig = await fs.readJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 3 (react-ts, vue-basic, other-js) template(s) from javascript!",
    );
    expect(all).toContain(
      "The following templates were not found: non-existent-A, non-existent-B",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("Updated, ignoring unknowns");
  });

  it("should update found templates while warning for missing ones when not using wildcard", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
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

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 1 (react-ts) template(s) from javascript!",
    );
    expect(all).toContain(
      "The following templates were not found: non-existent-template",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].description,
    ).toBe("A description that should fail for one");
  });
});

describe("Config Update - Global Configuration", () => {
  it("should update a single template in the global config with --global flag", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );
    const { exitCode, all } = await execute(
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

  it("should update ALL global templates using the wildcard '*' with --global flag", async () => {
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const newLocationPath = path.join(
      globalTemplatePath,
      "javascript",
      "react-ts.txt",
    );

    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "--global",
        "update",
        "javascript",
        "*",
        "-l",
        newLocationPath,
      ],
      { all: true, env: { HOME: globalConfigDir } },
    );

    const updatedConfig = await fs.readJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "Successfully updated 2 (react-ts, angular-js) template(s) from javascript!",
    );
    expect(
      updatedConfig.templates.javascript.templates["react-ts"].location,
    ).toBe(newLocationPath);
    expect(
      updatedConfig.templates.javascript.templates["angular-js"].location,
    ).toBe(newLocationPath);
  });
});

describe("Config Update - Failure and Edge Cases", () => {
  it("should fail gracefully if NO template names were found to act on", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "javascript",
        "non-existent-template-A",
        "non-existent-template-B",
        "-d",
        "some-description",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Template 'non-existent-template-A, non-existent-template-B' not found in configuration.",
    );
  });

  it("should fail gracefully if a language is not found (validation error, canonical language)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "python",
        "ts-template",
        "-d",
        "some-description",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Invalid value for Programming Language. Valid options are: javascript",
    );
  });

  it("should fail gracefully if an unknown language alias is provided (validation error)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { exitCode, all } = await execute(
      "bun",
      [
        CLI_PATH,
        "config",
        "update",
        "unknown-alias",
        "some-template",
        "-d",
        "some-description",
      ],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "Invalid value for Programming Language. Valid options are: javascript",
    );
  });

  it("should fail if no template name is provided", async () => {
    const { exitCode, all } = await execute(
      "bun",
      [CLI_PATH, "config", "update", "javascript"],
      { all: true, reject: false },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("error: missing required argument 'templateName'");
  });
});
