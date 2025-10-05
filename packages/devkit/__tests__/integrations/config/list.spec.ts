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
} from "../common.js";

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
        },
      },
    },
    nodejs: {
      templates: {
        "node-api": {
          description: "A Node.js API boilerplate",
          location: "https://github.com/node-api",
          alias: "na",
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
};

const invalidLocalConfigMissingRequiredSettings: Partial<CliConfig> = {
  ...localConfig,
  settings: {} as any,
} as any;

describe("dk config list", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-config-list-${Date.now()}`);
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

  it("should list local config by default", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "config", "list"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Using local configuration.");
    expect(all).toContain("Javascript");
    expect(all).toContain("Nodejs");
    expect(all).not.toContain("Typescript");
  });

  describe("Include defaults option", () => {
    it("should fall back to the `default` config if no local config exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Modèles disponibles :");
      expect(all).toContain("remix");
    });

    it("should fall back to the `default` config if no global config exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list", "--global", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain(
        "Using global configuration.(including default templates)",
      );
      expect(all).toContain("Available Templates:");
      expect(all).toContain("remix");
      expect(all).toContain("Typescript");
      expect(all).toContain("Javascript");
      expect(all).toContain("Nodejs");
    });

    it("should use both the `default` config and the local config if exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list", "--include-defaults"],
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

    it("should list templates from both local and global configurations when --all is used", async () => {
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
        [CLI_PATH, "config", "list", "--all"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Using local and global configurations.");
      expect(all).toContain("Javascript");
      expect(all).toContain("Nodejs");
      expect(all).toContain("Typescript");
    });

    it("should use both the `default` config and the global config if exists and `--include-defaults` is used", async () => {
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list", "--global", "--include-defaults"],
        {
          all: true,
          env: { HOME: globalConfigDir },
        },
      );

      expect(exitCode).toBe(0);
      expect(all).toContain("Modèles disponibles :");
      expect(all).toContain("Javascript");
      expect(all).toContain("remix");
      expect(all).toContain("Typescript");
      expect(all).toContain("ts-lib");
      expect(all).not.toContain("node-api");
    });
  });

  it("should only list global config when --global is used", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);
    await fs.writeJson(
      path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
      globalConfig,
    );

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "config", "list", "--global"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("Using global configuration.");
    expect(all).toContain("Typescript");
    expect(all).not.toContain("Javascript");
    expect(all).not.toContain("Nodejs");
  });

  it("should show an error when --global is used and no global config exists", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), localConfig);

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "config", "list", "--global"],
      {
        all: true,
        env: { HOME: globalConfigDir },
        reject: false,
      },
    );

    expect(exitCode).toBe(1);
    expect(all).toContain(
      "::[DEV]>> Devkit encountered an unexpected internal issue: Global configuration file not found.",
    );
  });

  it("should handle a config file with an empty templates section", async () => {
    const emptyConfig = {
      ...localConfig,
      templates: {},
      settings: { ...localConfig.settings },
    } as CliConfig;
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), emptyConfig);
    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "config", "list"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("No templates found in the configuration file.");
    expect(all).not.toContain("JAVASCRIPT");
    expect(all).not.toContain("NODEJS");
    expect(all).not.toContain("TYPESCRIPT");
  });

  it("should handle both local and global configs being empty", async () => {
    await fs.writeJson(path.join(tempDir, LOCAL_CONFIG_FILE_NAME), {
      ...localConfig,
      templates: {},
      settings: { ...localConfig.settings },
    });
    await fs.writeJson(path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME), {
      ...globalConfig,
      templates: {},
      settings: { ...globalConfig.settings },
    });

    const { all, exitCode } = await execute(
      "bun",
      [CLI_PATH, "config", "list"],
      {
        all: true,
        env: { HOME: globalConfigDir },
      },
    );

    expect(exitCode).toBe(0);
    expect(all).toContain("No templates found in the configuration file.");
    expect(all).not.toContain("Javascript");
    expect(all).not.toContain("Nodejs");
    expect(all).not.toContain("Typescript");
  });

  describe("Configuration Validation Failures", () => {
    const VALIDATION_ERROR_MESSAGE = "Configuration validation failed.";
    const TEMPLATE_ERROR_FRAGMENT = "is missing required field: 'location'";
    const SETTINGS_PM_ERROR_FRAGMENT =
      "The value for setting 'defaultPackageManager' is invalid";
    const SETTINGS_MISSING_ERROR_FRAGMENT =
      "The value for setting 'defaultPackageManager' is invalid or missing.";

    it("should fail and exit if local config is invalid (missing required template field)", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        invalidLocalConfigMissingLocation,
      );
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        globalConfig,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list"],
        {
          all: true,
          env: { HOME: globalConfigDir },
          reject: false,
        },
      );

      expect(exitCode).toBe(1);
      expect(all).toContain(VALIDATION_ERROR_MESSAGE);
      expect(all).toContain(TEMPLATE_ERROR_FRAGMENT);
    });

    it("should fail and exit if global config is invalid (malformed settings field) when using --all", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        localConfig,
      );
      await fs.writeJson(
        path.join(globalConfigDir, GLOBAL_CONFIG_FILE_NAME),
        invalidGlobalConfigMalformedSetting,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list", "--all"],
        {
          all: true,
          env: { HOME: globalConfigDir },
          reject: false,
        },
      );

      expect(exitCode).toBe(1);
      expect(all).toContain(VALIDATION_ERROR_MESSAGE);
      expect(all).toContain(SETTINGS_PM_ERROR_FRAGMENT);
    });

    it("should fail and exit if local config has empty/missing required settings fields", async () => {
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        invalidLocalConfigMissingRequiredSettings,
      );

      const { all, exitCode } = await execute(
        "bun",
        [CLI_PATH, "config", "list"],
        {
          all: true,
          env: { HOME: globalConfigDir },
          reject: false,
        },
      );

      expect(exitCode).toBe(1);
      expect(all).toContain(VALIDATION_ERROR_MESSAGE);
      expect(all).toContain(SETTINGS_MISSING_ERROR_FRAGMENT);
      expect(all).toContain(
        "The value for setting 'cacheStrategy' is invalid or missing.",
      );
      expect(all).toContain(
        "The value for setting 'language' is invalid or missing.",
      );
    });
  });
});
