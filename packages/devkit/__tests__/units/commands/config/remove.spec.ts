import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupRemoveCommand } from "../../../../src/commands/config/remove.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../../vitest.setup.js";
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

let actionFn: any;

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

vi.spyOn(console, "log").mockImplementation(() => {});

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
      mocktFn("remove_template.command.description"),
    );
  });

  describe("action handler", () => {
    it("should remove a template by its name", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(initialConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["vue-basic"], { global: false });

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockChalk.cyan(mocktFn("remove_template.start")),
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
        },
      });
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn("remove_template.success", {
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
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["vb"], { global: false });

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
        },
      });
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn("remove_template.success", {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove multiple templates at once", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["vue-basic", "react-basic"], {
        global: false,
      });

      expect(mockSaveLocalConfig).toHaveBeenCalledWith({
        settings: {},
        templates: {
          javascript: {
            templates: {},
          },
        },
      });
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn("remove_template.success", {
          count: "2",
          templateName: "vue-basic, react-basic",
          language: "javascript",
        }),
      );
    });

    it("should remove from global config with --global flag", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        ["vue-basic"],
        {},
        {
          parent: {
            opts: vi.fn(() => ({ global: true })),
          },
        },
      );

      expect(mockSaveGlobalConfig).toHaveBeenCalledOnce();
      expect(mockSaveGlobalConfig).toHaveBeenCalledWith({
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
        },
      });
    });

    it("should throw an error if no templates are found for the given language", async () => {
      const initialConfig = {
        settings: {},
        templates: {
          javascript: {
            templates: {},
          },
        },
      };
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(initialConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["react-basic"], { global: false });

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn("error.template.not_found", { template: "react-basic" }),
        ),
        mockSpinner,
      );
    });

    it("should throw an error if the templates are not found", async () => {
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["non-existent", "another-one"], {
        global: false,
      });

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn("error.template.not_found", {
            template: "non-existent, another-one",
          }),
        ),
        mockSpinner,
      );
    });

    it("should remove existing templates and warn about non-existent ones", async () => {
      const consoleLogSpy = vi.spyOn(console, "log");
      const initialConfig = structuredClone(sampleConfig);
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: initialConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["vue-basic", "non-existent"], {
        global: false,
      });

      expect(mockSaveLocalConfig).toHaveBeenCalledOnce();
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
        },
      });
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn("remove_template.success", {
          count: "1",
          templateName: "vue-basic",
          language: "javascript",
        }),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow(
          mocktFn("remove_template.not_found_warning", {
            template: "non-existent",
          }),
        ),
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Config read failed");
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

      setupRemoveCommand(mockConfigCommand);
      await actionFn("javascript", ["vue-basic"], { global: false });

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should handle an invalid language gracefully", async () => {
      const mockError = new DevkitError(
        "error.language_config_not_found - keys: language, values: invalid-lang",
      );
      mockValidateProgrammingLanguage.mockImplementation(() => {
        throw mockError;
      });

      setupRemoveCommand(mockConfigCommand);
      await actionFn("invalid-lang", ["vue-basic"], { global: false });

      expect(mockReadAndMergeConfigs).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
