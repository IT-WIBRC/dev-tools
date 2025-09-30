import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupRemoveCommand } from "../../../../src/commands/config/remove.js";
import { mockSpinner, mockLogger, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const {
  mockHandleErrorAndExit,
  mockReadAndMergeConfigs,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadAndMergeConfigs: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

vi.mock("#core/config/writer.js", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

const CMD_DESCRIPTION_KEY = "commands.template.remove.command.description";
const STATUS_REMOVING_KEY = "messages.status.template_removing";
const SUCCESS_REMOVED_KEY = "messages.success.template_removed";
const WARNING_NOT_FOUND_KEY = "warnings.templates_not_found";
const ERROR_TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const ERROR_LANG_NOT_FOUND_KEY = "errors.template.language_not_found";

describe("setupRemoveCommand", () => {
  let mockConfigCommand: any;

  const sampleConfig = {
    settings: {},
    templates: {
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
        },
      },
      typescript: {
        templates: {},
      },
    },
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

  describe("action handler", () => {
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

    it("should remove a template by its name", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(initialConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], false);

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(mocktFn(STATUS_REMOVING_KEY)),
      );
      expect(mockSaveLocalConfig).toHaveBeenCalledWith({
        settings: {},
        templates: {
          javascript: {
            templates: {
              "react-basic": {
                description: "A basic React template",
                location: "https://github.com/facebook/react",
              },
            },
          },
          typescript: {
            templates: {},
          },
        },
      });
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should remove a template by its alias", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vb"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          templates: {
            javascript: {
              templates: {
                "react-basic": {
                  description: "A basic React template",
                  location: "https://github.com/facebook/react",
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
    });

    it("should remove multiple templates at once (name and alias)", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic", "react-basic"], false);

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
          count: "2",
          templateName: "vue-basic, react-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove from global config when isGlobal is true", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], true);

      expect(mockSaveGlobalConfig).toHaveBeenCalledOnce();
      expect(mockSaveGlobalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          templates: {
            javascript: {
              templates: {
                "react-basic": {
                  description: "A basic React template",
                  location: "https://github.com/facebook/react",
                },
              },
            },
            typescript: {
              templates: {},
            },
          },
        }),
      );
    });

    it("should throw an error if no templates are found for the given language", async () => {
      const initialConfig = {
        settings: {},
        templates: {},
      };
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(initialConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

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

    it("should throw an error if none of the provided template names exist", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

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

    it("should remove existing templates and warn about non-existent ones", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic", "non-existent"], false);

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
      expect(mockSaveLocalConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          templates: {
            javascript: {
              templates: {
                "react-basic": {
                  description: "A basic React template",
                  location: "https://github.com/facebook/react",
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

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Config read failed");
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

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

      expect(mockReadAndMergeConfigs).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
