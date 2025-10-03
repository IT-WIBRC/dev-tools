import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupRemoveCommand } from "../../../../src/commands/config/remove.js";
import { mockSpinner, mockLogger, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import type {
  CliConfig,
  ConfigurationSource,
} from "../../../../src/utils/schema/schema.js";

const {
  mockHandleErrorAndExit,
  mockReadConfigSources,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadConfigSources: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#core/config/writer.js", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

const CMD_DESCRIPTION_KEY = "commands.template.remove.command.description";
const SUCCESS_REMOVED_KEY = "messages.success.template_removed";
const WARNING_NOT_FOUND_KEY = "warnings.template.list_not_found";
const ERROR_TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const ERROR_LANG_NOT_FOUND_KEY = "errors.template.language_not_found";
const ERROR_LOCAL_NOT_FOUND_KEY = "errors.config.local_not_found";
const ERROR_GLOBAL_NOT_FOUND_KEY = "errors.config.global_not_found";

const defaultTemplateConfig: CliConfig["templates"] = {
  javascript: {
    templates: {
      "vue-basic": {
        description: "A basic Vue template",
        location: "https://github.com/vuejs/vue",
        alias: "vb",
      },
      "react-basic": {
        description: "A basic React template",
        location: "https://github.com/facebook/react",
      },
      "node-cli": {
        description: "A Node.js CLI template",
        location: "https://github.com/node/node-cli",
      },
    },
  },
  typescript: {
    templates: {},
  },
};

const sampleConfig: CliConfig = {
  settings: {} as CliConfig["settings"],
  templates: defaultTemplateConfig,
};

const createMockSources = (
  targetType: ConfigurationSource,
): ReturnType<typeof mockReadConfigSources> => {
  const local = targetType === "local" ? structuredClone(sampleConfig) : null;
  const global = targetType === "global" ? structuredClone(sampleConfig) : null;
  return Promise.resolve({
    local,
    global,
    default: structuredClone(sampleConfig),
    configFound: targetType !== "default",
  });
};

describe("setupRemoveCommand", () => {
  let mockConfigCommand: any;
  const callAction = (
    language: string,
    templateNames: string[],
    isGlobal: boolean,
  ) => {
    const parentOpts = { global: isGlobal };
    return actionFn(
      language,
      templateNames,
      {},
      {
        parent: {
          opts: vi.fn(() => parentOpts),
        },
      },
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockConfigCommand = {
      command: vi.fn(() => mockConfigCommand),
      description: vi.fn(() => mockConfigCommand),
      option: vi.fn(() => mockConfigCommand),
      alias: vi.fn(() => mockConfigCommand),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockConfigCommand;
      }),
    };
    mockValidateProgrammingLanguage.mockReturnValue(true);
  });

  it("should set up the remove command with correct options and arguments", () => {
    setupRemoveCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "remove <language> <templateName...>",
    );
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("rm");
    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      mocktFn(CMD_DESCRIPTION_KEY),
    );
  });

  describe("action handler - Single and Multiple Named Removal", () => {
    it("should remove a template by its name from local config", async () => {
      mockReadConfigSources.mockImplementationOnce(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], false);

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            ...defaultTemplateConfig.settings,
          },
          templates: {
            javascript: {
              templates: {
                ...defaultTemplateConfig.javascript?.templates,
                "vue-basic": undefined,
              },
            },
            typescript: {
              ...defaultTemplateConfig.typescript,
            },
          },
        }),
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove a template by its alias", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vb"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove multiple templates at once (name and alias)", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic", "react-basic", "vb"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            ...defaultTemplateConfig.settings,
          },
          templates: {
            javascript: {
              templates: {
                "node-cli": {
                  ...defaultTemplateConfig.javascript?.templates?.["node-cli"],
                },
              },
            },
            typescript: {
              ...defaultTemplateConfig.typescript,
            },
          },
        }),
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "2",
          templateName: "vue-basic, react-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove from global config when isGlobal is true", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("global"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], true);

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });
      expect(mockSaveGlobalConfig).toHaveBeenCalledOnce();
    });
  });

  describe("action handler - Wildcard and Mixed Removal", () => {
    it("should remove ALL templates using the wildcard '*'", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["*"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          templates: {
            javascript: {
              templates: {},
            },
            typescript: {
              templates: {},
            },
          },
        }),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "3",
          templateName: "vue-basic, react-basic, node-cli",
          language: "javascript",
        }),
      );
      expect(mockLogger.warning).not.toHaveBeenCalled();
    });

    it("should remove ALL templates and warn about explicitly listed non-existent names (wildcard + extra)", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["*", "non-existent-A", "vb"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {},
          templates: {
            javascript: {
              templates: {},
            },
            typescript: {
              templates: {},
            },
          },
        }),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "3",
          templateName: "vue-basic, react-basic, node-cli",
          language: "javascript",
        }),
      );
      expect(mockLogger.warning).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(WARNING_NOT_FOUND_KEY, {
            templates: ["non-existent-A", "vb"].join(", "),
          }),
        ),
      );
    });

    it("should remove existing templates and warn about non-existent ones (no wildcard)", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic", "non-existent"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {},
          templates: {
            javascript: {
              templates: {
                "react-basic": {
                  ...defaultTemplateConfig.javascript?.templates?.[
                    "react-basic"
                  ],
                },
                "node-cli": {
                  ...defaultTemplateConfig.javascript?.templates?.["node-cli"],
                },
              },
            },
            typescript: {
              templates: {},
            },
          },
        }),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
      expect(mockLogger.warning).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(WARNING_NOT_FOUND_KEY, {
            templates: "non-existent",
          }),
        ),
      );
    });
  });

  describe("action handler - Error and Edge Cases", () => {
    const callAction = (
      language: string,
      templateNames: string[],
      isGlobal: boolean,
    ) => {
      const parentOpts = { global: isGlobal };
      return actionFn(
        language,
        templateNames,
        {},
        {
          parent: {
            opts: vi.fn(() => parentOpts),
          },
        },
      );
    };

    it("should throw DevkitError if local config is not found (isGlobal=false)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: structuredClone(sampleConfig),
        default: structuredClone(sampleConfig),
        configFound: true,
      });

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn(ERROR_LOCAL_NOT_FOUND_KEY)),
        mockSpinner,
      );
    });

    it("should throw DevkitError if global config is not found (isGlobal=true)", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: structuredClone(sampleConfig),
        global: null,
        default: structuredClone(sampleConfig),
        configFound: true,
      });

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], true);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn(ERROR_GLOBAL_NOT_FOUND_KEY)),
        mockSpinner,
      );
    });

    it("should throw an error if no templates are found for the given language", async () => {
      const initialConfig = {
        settings: {},
        templates: {},
      };
      mockReadConfigSources.mockResolvedValue({
        local: initialConfig,
        global: null,
        default: structuredClone(sampleConfig),
        configFound: true,
      });

      setupRemoveCommand(mockConfigCommand);
      await callAction("python", ["basic-script"], false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn(ERROR_LANG_NOT_FOUND_KEY, { language: "python" }),
        ),
        mockSpinner,
      );
    });

    it("should throw an error if none of the provided template names exist (templatesToActOn.length === 0)", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["non-existent", "another-one"], false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn(ERROR_TEMPLATE_NOT_FOUND_KEY, {
            template: "non-existent, another-one",
          }),
        ),
        mockSpinner,
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Config read failed");
      mockReadConfigSources.mockRejectedValue(mockError);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], false);

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should handle an invalid language gracefully", async () => {
      const mockError = new DevkitError("Invalid language provided");
      mockValidateProgrammingLanguage.mockImplementation(() => {
        throw mockError;
      });

      setupRemoveCommand(mockConfigCommand);
      await callAction("invalid-lang", ["vue-basic"], false);

      expect(mockReadConfigSources).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
