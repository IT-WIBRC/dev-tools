import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupConfigUpdateCommand } from "../../../src/commands/config/update.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../vitest.setup.js";
import type { CliConfig } from "../../../src/utils/configs/schema.js";

const {
  mockHandleErrorAndExit,
  mockGetConfigFilepath,
  mockReadConfigAtPath,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockGetConfigFilepath: vi.fn(),
  mockReadConfigAtPath: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
}));

let actionFn: any;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));
vi.mock("#utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));
vi.mock("#utils/configs/reader.js", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));
vi.mock("#utils/configs/writer.js", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));
vi.mock("deepmerge", () => ({
  default: vi.fn((x, y) => ({ ...x, ...y })),
}));

describe("setupConfigUpdateCommand", () => {
  let mockProgram: any;
  let config: CliConfig;

  const initialLocalConfig: CliConfig = {
    settings: {
      language: "en",
      cacheStrategy: "always-refresh",
      defaultPackageManager: "pnpm",
    },
    templates: {
      javascript: {
        templates: {
          "vue-basic": {
            description: "A basic Vue template",
            location: "https://github.com/vuejs/vue",
          },
          "react-alias": {
            description: "A react template with an alias",
            location: "https://github.com/react/react",
            alias: "react",
            cacheStrategy: "daily",
          },
        },
      },
    },
  };

  const initialGlobalConfig: CliConfig = {
    settings: {
      language: "en",
      cacheStrategy: "daily",
      defaultPackageManager: "yarn",
    },
    templates: {
      python: {
        templates: {
          django: {
            description: "A django template",
            location: "https://github.com/django/django",
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    config = JSON.parse(JSON.stringify(initialLocalConfig));
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the config update command correctly", () => {
    setupConfigUpdateCommand({
      program: mockProgram,
      config,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("update");
    expect(mockProgram.alias).toHaveBeenCalledWith("up");
    expect(mockProgram.description).toHaveBeenCalledWith(
      mocktFn("config.update.command.description"),
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<language>",
      mocktFn("config.update.language.argument"),
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<templateName>",
      mocktFn("config.update.template.argument"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-n, --new-name <string>",
      mocktFn("config.update.option.new_name"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-d, --description <string>",
      mocktFn("config.update.option.description"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-a, --alias <string>",
      mocktFn("config.update.option.alias"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --location <string>",
      mocktFn("config.update.option.location"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "--cache-strategy <string>",
      mocktFn("config.update.option.cache_strategy"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "--package-manager <string>",
      mocktFn("config.update.option.package_manager"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn("config.update.option.global"),
      false,
    );
  });

  it("should update a local template's description", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = { description: "Updated description" };

    const expectedConfig = JSON.parse(JSON.stringify(initialLocalConfig));
    expectedConfig.templates.javascript.templates["vue-basic"].description =
      "Updated description";

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success", { templateName }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update a local template by its alias", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "react"; // Alias
    const cmdOptions = { location: "https://new-react-location.com" };

    const expectedConfig = JSON.parse(JSON.stringify(initialLocalConfig));
    expectedConfig.templates.javascript.templates["react-alias"].location =
      "https://new-react-location.com";

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success", { templateName }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update multiple fields on a local template", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = {
      description: "My new description",
      location: "https://new-vue-location.com",
    };

    const expectedConfig = JSON.parse(JSON.stringify(initialLocalConfig));
    expectedConfig.templates.javascript.templates["vue-basic"] = {
      ...expectedConfig.templates.javascript.templates["vue-basic"],
      ...cmdOptions,
    };

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success", { templateName }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update a global template", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "python";
    const templateName = "django";
    const cmdOptions = {
      global: true,
      description: "Updated django template",
    };

    const globalConfigPath = "/home/user/.devkitrc.json";
    mockGetConfigFilepath.mockResolvedValue(globalConfigPath);
    mockReadConfigAtPath.mockResolvedValue(
      JSON.parse(JSON.stringify(initialGlobalConfig)),
    );

    const expectedConfig = JSON.parse(JSON.stringify(initialGlobalConfig));
    expectedConfig.templates.python.templates.django.description =
      "Updated django template";

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveGlobalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success", { templateName }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should rename a local template", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const newName = "vue-latest";
    const cmdOptions = { newName };

    const expectedConfig = JSON.parse(JSON.stringify(initialLocalConfig));
    const templateToMove =
      expectedConfig.templates.javascript.templates["vue-basic"];
    delete expectedConfig.templates.javascript.templates["vue-basic"];
    expectedConfig.templates.javascript.templates["vue-latest"] =
      templateToMove;

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success_name", {
          oldName: templateName,
          newName,
        }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should remove optional fields with 'null' value", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "react"; // Alias
    const cmdOptions = { alias: "null", cacheStrategy: "null" };

    const expectedConfig = JSON.parse(JSON.stringify(initialLocalConfig));
    const reactTemplate =
      expectedConfig.templates.javascript.templates["react-alias"];
    delete reactTemplate.alias;
    delete reactTemplate.cacheStrategy;

    await actionFn(language, templateName, cmdOptions);

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(expectedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.italic.green(
        mocktFn("config.update.success", { templateName }),
      ),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw an error for a non-existent template", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "non-existent";
    const cmdOptions = {};

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.template.not_found", { template: templateName }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for a non-existent language", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "go";
    const templateName = "gin";
    const cmdOptions = {};

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn("error.language_config_not_found", { language })),
      mockSpinner,
    );
  });

  it("should throw an error if no config file is found (source: 'default')", async () => {
    setupConfigUpdateCommand({
      program: mockProgram,
      config,
      source: "default",
    });
    const language = "js";
    const templateName = "test";
    const cmdOptions = {};

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn("error.config.no_file_found")),
      mockSpinner,
    );
  });

  it("should throw an error for a required field with 'null' value", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = { description: "null" };

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.remove_required", { key: "description" }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid package manager", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = { packageManager: "invalid-pm" };

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.package_manager", {
          value: "invalid-pm",
          options: "bun, npm, yarn, deno, pnpm",
        }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid cache strategy", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = { cacheStrategy: "invalid-cache" };

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.cache_strategy", {
          value: "invalid-cache",
          options: "always-refresh, never-refresh, daily",
        }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error if new name already exists", async () => {
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const newName = "react-alias";
    const cmdOptions = { newName };

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn("error.template.exists", { template: newName })),
      mockSpinner,
    );
  });

  it("should handle an error during the save operation", async () => {
    const mockError = new Error("Save failed");
    mockSaveLocalConfig.mockRejectedValue(mockError);
    setupConfigUpdateCommand({ program: mockProgram, config, source: "local" });
    const language = "javascript";
    const templateName = "vue-basic";
    const cmdOptions = { description: "New" };

    await actionFn(language, templateName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
