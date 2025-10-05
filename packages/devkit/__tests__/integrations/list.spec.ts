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
  defaultCliConfig,
  type CliConfig,
  execute,
} from "./common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;

const localConfig: CliConfig = {
  ...defaultCliConfig,
  settings: {
    ...defaultCliConfig.settings,
    language: "en",
  },
  templates: {
    javascript: {
      templates: {
        "react-ts": {
          description: "A React project with TypeScript",
          location: "https://github.com/react-ts-template",
          alias: "rt",
          packageManager: "npm",
        },
        "vue-basic": {
          description: "A basic Vue template",
          location: "https://github.com/vuejs/vue",
          alias: "vb",
          packageManager: "pnpm",
        },
      },
    },
    nodejs: {
      templates: {
        "node-api": {
          description: "A Node.js API boilerplate",
          location: "https://github.com/node-api",
          alias: "na",
          packageManager: "yarn",
        },
      },
    },
  },
};

const globalConfig: CliConfig = {
  ...defaultCliConfig,
  settings: {
    ...defaultCliConfig.settings,
    language: "fr",
  },
  templates: {
    typescript: {
      templates: {
        "ts-lib": {
          description: "A TypeScript library template",
          location: "https://github.com/ts-lib-template",
          alias: "tl",
        },
      },
    },
  },
};

const invalidLocalConfigMissingLocation: Partial<CliConfig> = {
  ...localConfig,
  templates: {
    javascript: {
      templates: {
        "bad-template": {
          description: "Missing Location",
          alias: "bt",
          packageManager: "npm",
        } as any,
      },
    } as any,
  },
} as any;

const invalidGlobalConfigMalformedSetting: Partial<CliConfig> = {
  ...globalConfig,
  settings: {
    ...globalConfig.settings,
    defaultPackageManager: "invalid-package-manager-alias" as any,
  },
} as any;

describe("dk list", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-list-${Date.now()}`);
    globalConfigDir = path.join(
      os.tmpdir(),
      `devkit-global-config-dir-${Date.now()}`,
    );
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  it("should list templates from local config by default when it exists", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration sources loaded successfully.");
    expect(all).toContain("Available Templates:");
    expect(all).toContain("Javascript");
    expect(all).toContain("Nodejs");
    expect(all).not.toContain("Typescript");
  });

  it("should list templates from both local and global configurations when --all is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--all"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration sources loaded successfully.");
    expect(all).toContain("Available Templates:");
    expect(all).toContain("Javascript");
    expect(all).toContain("Nodejs");
    expect(all).toContain("Typescript");
  });

  it("should only list templates from global config when --global is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--global"],
      {
        all: true,
        env: {
          HOME: globalConfigDir,
          CWD: tempDir,
        },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Configuration sources loaded successfully.");
    expect(all).toContain("Available Templates:");
    expect(all).toContain("Typescript");
    expect(all).not.toContain("Javascript");
    expect(all).not.toContain("Nodejs");
  });

  it("should filter templates by language argument (canonical name)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "javascript"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Javascript");
    expect(all).toContain("react-ts");
    expect(all).toContain("vue-basic");
    expect(all).not.toContain("Nodejs");
  });

  it("should filter templates by 'js' language alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "list", "js"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Javascript");
    expect(all).toContain("react-ts");
    expect(all).toContain("vue-basic");
    expect(all).not.toContain("Nodejs");
  });

  it("should filter templates by 'node' language alias", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute("bun", [CLI_PATH, "list", "node"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("Nodejs");
    expect(all).toContain("node-api");
    expect(all).not.toContain("Javascript");
  });

  it("should filter templates by name using the --where syntax", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--where", "name:vue"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("vue-basic");
    expect(all).not.toContain("react-ts");
    expect(all).not.toContain("node-api");
  });

  it("should filter templates by alias using the --where syntax and exact regex match", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--where", "alias:/^rt$/"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("react-ts");
    expect(all).not.toContain("vue-basic");
  });

  it("should filter templates by substring in packageManager, matching both npm and pnpm", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--where", "pm:npm"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("react-ts");
    expect(all).not.toContain("node-api");
  });

  it("should filter templates by substring in packageManager, matching only npm", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--where", "pm:/^npm/"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("react-ts");
    expect(all).not.toContain("vue-basic");
    expect(all).not.toContain("node-api");
  });

  it("should filter templates using multiple clauses (Logical AND)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--where", "alias:vb", "desc:vue"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("vue-basic");
    expect(all).not.toContain("react-ts");
  });

  it("should display settings when --settings is used (default mode: local)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--settings"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Settings:");
    expect(all).toContain("language");
    expect(all).toContain("en");
    expect(all).toContain("Available Templates:");
  });

  it("should display settings from merged config when --settings and --all are used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--settings", "--all"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Settings:");
    expect(all).toContain("language");
    expect(all).toContain("en");
    expect(all).toContain("Available Templates:");
  });

  it("should display settings from merged config when --settings, --all and mode=table are used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--settings", "--all", "--mode", "table"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Settings:");
    expect(all).toContain("language");
    expect(all).toContain("en");
    expect(all).toContain("Available Templates:");
  });

  it("should include defaults when --include-defaults is used", async () => {
    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--include-defaults"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Available Templates:");
    expect(all).not.toContain("No templates found in the configuration file.");
  });

  it("should show a warning if language is provided but no templates are found for it", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), {
      ...localConfig,
      templates: {
        javascript: {
          templates: {},
        },
        nodejs: localConfig.templates.nodejs,
      },
    });

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "javascript"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain(
      "No templates found for the 'javascript' language in the config.",
    );
    expect(all).not.toContain("Available Templates:");
  });

  it("should show an error if an invalid language is provided (validation error)", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "rust$"],
      {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain("Invalid value for Programming Language.");
  });

  it("should handle a config file with an empty templates section (warns)", async () => {
    const emptyLocalConfig = { ...localConfig, templates: {} };
    await fs.writeJson(
      path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
      emptyLocalConfig,
    );

    const { all, exitCode } = await execute("bun", [CLI_PATH, "list"], {
      all: true,
      env: { HOME: globalConfigDir },
    });

    expect(exitCode).toBe(0);
    expect(all).toContain("No templates found in the configuration.");
    expect(all).not.toContain("Available Templates:");
  });

  it("should handle both local and global configs are empty (warns)", async () => {
    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "list", "--all"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("No templates found in the configuration.");
  });

  describe("dk list (--mode table)", () => {
    it("should list templates from local config by default when it exists", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--mode", "table"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Configuration sources loaded successfully.");
      expect(all).toContain("Available Templates:");
      expect(all).toContain("Language");
      expect(all).toContain("Javascript");
      expect(all).toContain("Nodejs");
      expect(all).not.toContain("Typescript");
    });

    it("should filter templates by 'js' language alias in table mode", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "js", "--mode", "table"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Javascript");
      expect(all).toContain("react-ts");
      expect(all).not.toContain("Nodejs");
    });

    it("should handle both local and global configs being empty", async () => {
      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--all", "--mode", "table"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("No templates found in the configuration.");
    });

    it("should filter templates by name when --where is used in table mode", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--where", "name:vue", "--mode", "table"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Javascript");
      expect(all).toContain("vue-basic");
      expect(all).not.toContain("react-ts");
      expect(all).not.toContain("Nodejs");
      expect(all).not.toContain("Typescript");
    });
  });

  describe("Include defaults option", () => {
    it("should fall back to the `default` config if no local config exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain(
        "Modèles disponibles :(incluant les modèles par défaut)",
      );
      expect(all).toContain("remix");
    });

    it("should fall back to the `default` config if no global config exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--global", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Available Templates:");
      expect(all).toContain("remix");
    });

    it("should use both the `default` config and the local config if exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Available Templates:");
      expect(all).toContain("Javascript");
      expect(all).toContain("remix");
      expect(all).toContain("Nodejs");
      expect(all).toContain("node-api");
    });

    it("should use both the `default` config and the global config if exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "list", "--global", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain(
        "Modèles disponibles :(incluant les modèles par défaut)",
      );
      expect(all).toContain("Javascript");
      expect(all).toContain("remix");
      expect(all).toContain("Typescript");
      expect(all).toContain("ts-lib");
      expect(all).not.toContain("node-api");
    });
  });

  describe("Configuration Validation Failures (New Feature Tests)", () => {
    const VALIDATION_ERROR_MESSAGE =
      "[CONFIG]>> Failed to read configuration: Configuration validation failed.";
    const TEMPLATE_ERROR_FRAGMENT = "is missing required field: 'location'";
    const SETTINGS_ERROR_FRAGMENT =
      "The value for setting 'defaultPackageManager' is invalid";

    it("should fail and exit if local config is invalid (missing required template field)", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        invalidLocalConfigMissingLocation,
      );
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute("bun", [CLI_PATH, "list"], {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      });

      expect(exitCode).toBe(1);
      expect(all).toContain(VALIDATION_ERROR_MESSAGE);
      expect(all).toContain(TEMPLATE_ERROR_FRAGMENT);
      expect(all).not.toContain("Available Templates:");
    });

    it("should fail and exit if global config is invalid (malformed settings field) even when listing local", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        invalidGlobalConfigMalformedSetting,
      );

      const { all, exitCode } = await execute("bun", [CLI_PATH, "list"], {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      });

      expect(exitCode).toBe(1);
      expect(all).toContain(VALIDATION_ERROR_MESSAGE);
      expect(all).toContain(SETTINGS_ERROR_FRAGMENT);
      expect(all).not.toContain("Available Templates:");
    });
  });
});
