import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupRemoveTemplateCommand } from "../../src/commands/removeTemplate.js";
import { DevkitError } from "../../src/utils/errors/base.js";
import { mockSpinner } from "../../vitest.setup.js";
import type { CliConfig } from "../../src/utils/configs/schema.js";

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

vi.mock("#utils/configs/path-finder", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

vi.mock("#utils/configs/reader", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));

vi.mock("#utils/configs/writer", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

describe("setupRemoveTemplateCommand", () => {
  let mockProgram: any;
  let localConfigCopy: CliConfig;
  let globalConfigCopy: CliConfig;

  const initialLocalConfig: CliConfig = {
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
          },
        },
      },
      typescript: {
        templates: {
          "ts-node": {
            description: "A simple TS project",
            location: "https://github.com/microsoft/TypeScript-Node-Starter",
          },
        },
      },
    },
    settings: {
      language: "en",
      cacheStrategy: "always-refresh",
      defaultPackageManager: "bun",
    },
  };

  const initialGlobalConfig: CliConfig = {
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
    settings: {
      language: "en",
      cacheStrategy: "never-refresh",
      defaultPackageManager: "npm",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Deep clone the configs before each test
    localConfigCopy = JSON.parse(JSON.stringify(initialLocalConfig));
    globalConfigCopy = JSON.parse(JSON.stringify(initialGlobalConfig));

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

  it("should set up the remove-template command correctly", () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("remove-template");
    expect(mockProgram.alias).toHaveBeenCalledWith("rt");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "remove_template.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<language>",
      "remove_template.language.argument",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<templateName>",
      "remove_template.name.argument",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "remove_template.option.global",
      false,
    );
  });

  it("should remove a template from the local config by name", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    const language = "javascript";
    const templateName = "vue-basic";

    const { [templateName]: _, ...restOfTemplates } =
      localConfigCopy.templates.javascript!.templates;
    const updatedConfig = {
      ...localConfigCopy,
      templates: {
        ...localConfigCopy.templates,
        javascript: {
          ...localConfigCopy.templates.javascript,
          templates: restOfTemplates,
        },
      },
    };

    await actionFn(language, templateName, { global: false });

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(updatedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      `remove_template.success- options templateName:${templateName}, language:${language}`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should remove a template from the local config by alias", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    const language = "javascript";
    const templateName = "react";
    const templateKey = "react-alias";

    const { [templateKey]: _, ...restOfTemplates } =
      localConfigCopy.templates.javascript!.templates;
    const updatedConfig = {
      ...localConfigCopy,
      templates: {
        ...localConfigCopy.templates,
        javascript: {
          ...localConfigCopy.templates.javascript,
          templates: restOfTemplates,
        },
      },
    };

    await actionFn(language, templateName, { global: false });

    expect(mockSaveLocalConfig).toHaveBeenCalledWith(updatedConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      `remove_template.success- options templateName:${templateName}, language:${language}`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should remove a template from the global config", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    const globalConfigPath = "/home/user/.devkitrc.json";
    const language = "python";
    const templateName = "django";

    mockGetConfigFilepath.mockResolvedValue(globalConfigPath);
    mockReadConfigAtPath.mockResolvedValue(globalConfigCopy);

    const { [templateName]: _, ...restOfTemplates } =
      globalConfigCopy.templates.python!.templates;
    const updatedGlobalConfig = {
      ...globalConfigCopy,
      templates: {
        ...globalConfigCopy.templates,
        python: {
          ...globalConfigCopy.templates.python,
          templates: restOfTemplates,
        },
      },
    };

    await actionFn(language, templateName, { global: true });

    expect(mockReadConfigAtPath).toHaveBeenCalledWith(globalConfigPath);
    expect(mockSaveGlobalConfig).toHaveBeenCalledWith(updatedGlobalConfig);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      `remove_template.success- options templateName:${templateName}, language:${language}`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw an error if no config file is found (source: 'default')", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: {} as CliConfig,
      source: "default",
    });
    await actionFn("js", "test", { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError("error.config.no_file_found"),
      mockSpinner,
    );
  });

  it("should throw an error if --global is used but no global config exists", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    mockGetConfigFilepath.mockResolvedValue("/home/user/.devkitrc.json");
    mockReadConfigAtPath.mockResolvedValue(null);

    await actionFn("js", "test", { global: true });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError("error.config.global.not.found"),
      mockSpinner,
    );
  });

  it("should throw an error if the local config is not found (source !== 'local')", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: globalConfigCopy,
      source: "global",
    });
    await actionFn("js", "test", { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError("error.config.local.not.found"),
      mockSpinner,
    );
  });

  it("should throw an error if the specified language is not found", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    const language = "go";
    const templateName = "gin";

    await actionFn(language, templateName, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        `error.language_config_not_found- options language:${language}`,
      ),
      mockSpinner,
    );
  });

  it("should throw an error if the template is not found", async () => {
    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    const language = "javascript";
    const templateName = "non-existent-template";

    await actionFn(language, templateName, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        `error.template.not_found- options template:${templateName}`,
      ),
      mockSpinner,
    );
  });

  it("should handle an error during the save operation", async () => {
    const mockError = new Error("Save failed");
    mockSaveLocalConfig.mockRejectedValue(mockError);

    setupRemoveTemplateCommand({
      program: mockProgram,
      config: localConfigCopy,
      source: "local",
    });
    await actionFn("javascript", "vue-basic", { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
