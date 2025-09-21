import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupAddCommand } from "../../../../src/commands/config/add.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const {
  mockHandleErrorAndExit,
  mockReadAndMergeConfigs,
  mockValidateAndSaveTemplate,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadAndMergeConfigs: vi.fn(),
  mockValidateAndSaveTemplate: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

let actionFn: any;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("../../../../src/commands/config/validate-and-save.js", () => ({
  validateAndSaveTemplate: mockValidateAndSaveTemplate,
}));

describe("setupAddCommand", () => {
  let mockConfigCommand: any;

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

  it("should set up the add command with correct options and arguments", () => {
    setupAddCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "add <language> <templateName>",
    );

    expect(mockConfigCommand.alias).toHaveBeenCalledWith("a");
    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      mocktFn("cli.add_template.description"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-d, --description <string>",
      mocktFn("cli.add_template.options.description"),
      "",
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-o, --location <string>",
      mocktFn("new.project.template.option.description"),
      "",
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-a, --alias <string>",
      mocktFn("cli.add_template.options.alias"),
      "",
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-c, --cache-strategy <string>",
      mocktFn("cli.add_template.options.cache"),
      "",
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-p, --package-manager <string>",
      mocktFn("cli.add_template.options.package_manager"),
      "",
    );
  });

  describe("action handler", () => {
    const defaultCmdOptions = {
      description: "A simple template",
      location: "http://example.com/template",
      alias: "st",
      cacheStrategy: "network_only",
      packageManager: "npm",
      global: false,
    };

    it("should process and save a new template with all options", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: mockConfig,
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupAddCommand(mockConfigCommand);
      await actionFn("typescript", "my-template", defaultCmdOptions);

      expect(mockSpinner.start).toHaveBeenCalledOnce();
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });
      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "typescript",
      );
      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        {
          language: "typescript",
          templateName: "my-template",
          description: defaultCmdOptions.description,
          location: defaultCmdOptions.location,
          alias: defaultCmdOptions.alias,
          cacheStrategy: defaultCmdOptions.cacheStrategy,
          packageManager: defaultCmdOptions.packageManager,
        },
        mockConfig,
        false,
        mockSpinner,
      );
    });

    it("should throw DevkitError if description is missing", async () => {
      setupAddCommand(mockConfigCommand);
      const cmdOptions = { ...defaultCmdOptions, description: "" };

      await actionFn("typescript", "my-template", cmdOptions);

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn("error.missing_required_options.add_template", {
            fields: "--description, --location",
          }),
        ),
        mockSpinner,
      );
    });

    it("should throw DevkitError if location is missing", async () => {
      setupAddCommand(mockConfigCommand);
      const cmdOptions = { ...defaultCmdOptions, location: "" };

      await actionFn("typescript", "my-template", cmdOptions);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn("error.missing_required_options.add_template", {
            fields: "--description, --location",
          }),
        ),
        mockSpinner,
      );
    });

    it("should handle `global` flag correctly", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupAddCommand(mockConfigCommand);
      await actionFn(
        "python",
        "django-app",
        {
          ...defaultCmdOptions,
        },
        {
          parent: {
            opts: vi.fn(() => ({ global: true })),
          },
        },
      );

      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: true,
      });
      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        mockConfig,
        true,
        mockSpinner,
      );
    });

    it("should handle an invalid language gracefully", async () => {
      const mockError = new DevkitError(
        "error.language_config_not_found - keys: language, values: invalid-lang",
      );
      mockValidateProgrammingLanguage.mockImplementationOnce(() => {
        throw mockError;
      });

      setupAddCommand(mockConfigCommand);
      await actionFn("invalid-lang", "my-template", defaultCmdOptions);

      expect(mockReadAndMergeConfigs).not.toHaveBeenCalled();

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Unexpected error");
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

      setupAddCommand(mockConfigCommand);
      await actionFn("typescript", "my-template", defaultCmdOptions);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
