import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupAddCommand } from "../../../../src/commands/config/add.js";
import { mockLogger, mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import type {
  CliConfig,
  TextLanguageValues,
} from "../../../../src/utils/schema/schema.js";

const {
  mockHandleErrorAndExit,
  mockReadConfigSources,
  mockValidateAndSaveTemplate,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockReadConfigSources: vi.fn(),
  mockValidateAndSaveTemplate: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("../../../../src/commands/config/validate-and-save.js", () => ({
  validateAndSaveTemplate: mockValidateAndSaveTemplate,
}));

const MOCK_DEFAULT_CONFIG: CliConfig = {
  settings: {
    language: "en",
    cacheStrategy: "daily",
    defaultPackageManager: "npm",
  },
  templates: {},
};
const MOCK_LOCAL_CONFIG: CliConfig = {
  settings: {
    language: "fr",
    cacheStrategy: "never-refresh",
    defaultPackageManager: "pnpm",
  },
  templates: {},
};
const MOCK_GLOBAL_CONFIG: CliConfig = {
  settings: {
    language: "es" as TextLanguageValues,
    cacheStrategy: "always-refresh",
    defaultPackageManager: "yarn",
  },
  templates: {},
};

describe("setupAddCommand", () => {
  let mockConfigCommand: any;

  const MISSING_REQUIRED_KEY = "errors.command.missing_required_options";
  const TEMPLATE_ADDING_KEY = "messages.status.template_adding";

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
    mockReadConfigSources.mockResolvedValue({
      local: MOCK_LOCAL_CONFIG,
      global: MOCK_GLOBAL_CONFIG,
      default: MOCK_DEFAULT_CONFIG,
      configFound: true,
    });
    mockValidateProgrammingLanguage.mockReturnValue(true);
  });

  it("should set up the add command with correct options and arguments", () => {
    setupAddCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "add <language> <templateName>",
    );
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("a");
  });

  describe("action handler (Targeting Logic)", () => {
    const defaultCmdOptions = {
      description: "A simple template",
      location: "http://example.com/template",
      alias: "st",
      cacheStrategy: "network_only",
      packageManager: "npm",
    };

    const mockParentCommand = {
      parent: {
        opts: vi.fn(() => ({ global: false })),
      },
    };

    it("should process and save a new template targeting the LOCAL config by default", async () => {
      setupAddCommand(mockConfigCommand);
      await actionFn(
        "typescript",
        "my-template",
        defaultCmdOptions,
        mockParentCommand,
      );

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockLogger.spinner).toHaveBeenCalled();
      expect(mockLogger.spinner).toHaveBeenCalledWith(
        expect.stringContaining(
          mocktFn(TEMPLATE_ADDING_KEY, { templateName: "my-template" }),
        ),
      );

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ language: "typescript" }),
        MOCK_LOCAL_CONFIG,
        false,
        mockSpinner,
      );
    });

    it("should target the GLOBAL config when the parent command's `--global` flag is set", async () => {
      setupAddCommand(mockConfigCommand);
      mockParentCommand.parent.opts.mockReturnValue({ global: true });

      await actionFn(
        "python",
        "django-app",
        defaultCmdOptions,
        mockParentCommand as any,
      );

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });

      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ language: "python" }),
        MOCK_GLOBAL_CONFIG,
        true,
        mockSpinner,
      );
    });

    it("should fallback to DEFAULT config if LOCAL is null and not global mode", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: MOCK_GLOBAL_CONFIG,
        default: MOCK_DEFAULT_CONFIG,
        configFound: false,
      });

      setupAddCommand(mockConfigCommand);
      mockParentCommand.parent.opts.mockReturnValue({ global: false });

      await actionFn(
        "javascript",
        "js-app",
        defaultCmdOptions,
        mockParentCommand as any,
      );

      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        MOCK_DEFAULT_CONFIG,
        false,
        mockSpinner,
      );
    });

    it("should fallback to DEFAULT config if GLOBAL is null and in global mode", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: MOCK_LOCAL_CONFIG,
        global: null,
        default: MOCK_DEFAULT_CONFIG,
        configFound: false,
      });

      setupAddCommand(mockConfigCommand);
      mockParentCommand.parent.opts.mockReturnValue({ global: true });

      await actionFn(
        "javascript",
        "js-app",
        defaultCmdOptions,
        mockParentCommand as any,
      );

      expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        MOCK_DEFAULT_CONFIG,
        true,
        mockSpinner,
      );
    });

    it("should throw DevkitError if description is missing (required field validation)", async () => {
      setupAddCommand(mockConfigCommand);
      const cmdOptions = { ...defaultCmdOptions, description: "" };

      await actionFn(
        "typescript",
        "my-template",
        cmdOptions,
        mockParentCommand as any,
      );

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn(MISSING_REQUIRED_KEY, {
            fields: "--description, --location",
          }),
        ),
        mockSpinner,
      );
      expect(mockReadConfigSources).not.toHaveBeenCalled();
    });

    it("should throw DevkitError if location is missing (required field validation)", async () => {
      setupAddCommand(mockConfigCommand);
      const cmdOptions = { ...defaultCmdOptions, location: "" };

      await actionFn(
        "typescript",
        "my-template",
        cmdOptions,
        mockParentCommand as any,
      );

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          mocktFn(MISSING_REQUIRED_KEY, {
            fields: "--description, --location",
          }),
        ),
        mockSpinner,
      );
      expect(mockReadConfigSources).not.toHaveBeenCalled();
    });

    it("should handle an invalid language gracefully (pre-config load)", async () => {
      const mockError = new DevkitError(
        "error.language_config_not_found - keys: language, values: invalid-lang",
      );
      mockValidateProgrammingLanguage.mockImplementationOnce(() => {
        throw mockError;
      });

      setupAddCommand(mockConfigCommand);
      await actionFn(
        "invalid-lang",
        "my-template",
        defaultCmdOptions,
        mockParentCommand as any,
      );

      expect(mockReadConfigSources).not.toHaveBeenCalled();

      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Unexpected error");
      mockReadConfigSources.mockRejectedValue(mockError);

      setupAddCommand(mockConfigCommand);
      await actionFn(
        "typescript",
        "my-template",
        defaultCmdOptions,
        mockParentCommand as any,
      );

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
