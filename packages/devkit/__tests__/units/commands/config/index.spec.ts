import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../../vitest.setup.js";
import type { CliConfig } from "../../../integrations/common.js";

const MOCK_LOCAL_CONFIG: CliConfig = {
  settings: { language: "en", packageManager: "npm" } as any,
  templates: {},
};

const MOCK_GLOBAL_CONFIG: CliConfig = {
  settings: { language: "fr", packageManager: "yarn" } as any,
  templates: {},
};

const MOCK_CONFIG_SOURCES = {
  local: MOCK_LOCAL_CONFIG,
  global: MOCK_GLOBAL_CONFIG,
  default: null,
  configFound: true,
};

const {
  mockReadConfigSources,
  mockHandleNonInteractiveSettingsUpdate,
  mockHandleErrorAndExit,
  mockSetupAddCommand,
  mockSetupRemoveCommand,
  mockSetupUpdateCommand,
  mockSetupListCommand,
} = vi.hoisted(() => ({
  mockReadConfigSources: vi.fn(),
  mockHandleNonInteractiveSettingsUpdate: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
  mockSetupAddCommand: vi.fn(),
  mockSetupRemoveCommand: vi.fn(),
  mockSetupUpdateCommand: vi.fn(),
  mockSetupListCommand: vi.fn(),
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveSettingsUpdate: mockHandleNonInteractiveSettingsUpdate,
}));

vi.mock("../../../../src/utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("../../../../src/commands/config/add.js", () => ({
  setupAddCommand: mockSetupAddCommand,
}));

vi.mock("../../../../src/commands/config/remove.js", () => ({
  setupRemoveCommand: mockSetupRemoveCommand,
}));

vi.mock("../../../../src/commands/config/update.js", () => ({
  setupUpdateCommand: mockSetupUpdateCommand,
}));

vi.mock("../../../../src/commands/config/list.js", () => ({
  setupListCommand: mockSetupListCommand,
}));

console.log = mockLogger.log;

describe("setupConfigCommand", () => {
  let mockProgram: any;
  let mockAction: (keys: string[], cmdOptions: any) => Promise<void>;

  const DESC_KEY = "commands.config.command.description";
  const NO_COMMAND_WARN_KEY = "warnings.no_command_provided";
  const SET_SUCCESS_KEY = "messages.success.config_updated";
  const GET_SUCCESS_KEY = "messages.success.config_read";
  const INVALID_FORMAT_KEY = "errors.command.set_invalid_format";
  const GET_NOT_FOUND_KEY = "errors.config.get_key_not_found";
  const CONFIG_LOADING_KEY = "messages.status.config_loading";

  beforeEach(() => {
    vi.clearAllMocks();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        mockAction = fn;
        return mockProgram;
      }),
    };
    mockReadConfigSources.mockResolvedValue(MOCK_CONFIG_SOURCES);
  });

  it("should set up the config command with correct options and subcommands", () => {
    setupConfigCommand(mockProgram);

    expect(mockProgram.command).toHaveBeenCalledWith("config [keys...]");
    expect(mockProgram.alias).toHaveBeenCalledWith("conf");
    expect(mockProgram.description).toHaveBeenCalledWith(mocktFn(DESC_KEY));
    expect(mockSetupAddCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupRemoveCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupUpdateCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupListCommand).toHaveBeenCalledWith(mockProgram);
  });

  describe("action handler", () => {
    it("should default to warning if no keys or options are provided", async () => {
      setupConfigCommand(mockProgram);
      await mockAction([], { global: false });

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(mocktFn(CONFIG_LOADING_KEY)),
      );

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        mocktFn(NO_COMMAND_WARN_KEY),
      );
    });

    it("should call handleNonInteractiveSettingsUpdate for --set flag and respect the --global flag", async () => {
      setupConfigCommand(mockProgram);

      const cmdOptions = {
        set: ["language", "typescript", "pm", "bun"],
        global: true,
      };
      await mockAction([], cmdOptions);

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "language",
        "typescript",
        true,
      );

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "pm",
        "bun",
        true,
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(SET_SUCCESS_KEY)),
      );
    });

    it("should fail for invalid --set format (odd number of arguments)", async () => {
      setupConfigCommand(mockProgram);

      const cmdOptions = { set: ["language"], global: false };
      await mockAction([], cmdOptions);

      expect(mockHandleNonInteractiveSettingsUpdate).not.toHaveBeenCalled();

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        mockLogger.colors.redBright(mocktFn(INVALID_FORMAT_KEY)),
      );
    });

    it("should print a single config value when a key is provided (GET functionality) from Local by default", async () => {
      mockReadConfigSources.mockResolvedValue({
        ...MOCK_CONFIG_SOURCES,
        local: {
          settings: {},
          templates: {
            javascript: {},
          },
        } as unknown as CliConfig,
      });

      setupConfigCommand(mockProgram);
      await mockAction(["language"], { global: false });

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.yellowBold(
          mocktFn("errors.config.get_key_not_found", {
            key: "language",
          }),
        ),
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(GET_SUCCESS_KEY)),
      );
    });

    it("should print a single config value when a key is provided (GET functionality) from Global when --global is set", async () => {
      mockReadConfigSources.mockResolvedValue({
        ...MOCK_CONFIG_SOURCES,
        global: { settings: { language: "fr" }, templates: {} } as CliConfig,
      });

      setupConfigCommand(mockProgram);
      await mockAction(["language"], { global: true });

      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.yellowBold("language") + ": " + "fr",
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(GET_SUCCESS_KEY)),
      );
    });

    it("should handle a non-existent key gracefully (GET functionality)", async () => {
      mockReadConfigSources.mockResolvedValue({
        ...MOCK_CONFIG_SOURCES,
        local: { settings: {}, templates: {} } as CliConfig,
      });

      setupConfigCommand(mockProgram);
      await mockAction(["nonexistent_key"], {});

      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.redBright(
          mocktFn(GET_NOT_FOUND_KEY, {
            key: "nonexistent_key",
          }),
        ),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(GET_SUCCESS_KEY)),
      );
    });

    it("should handle errors gracefully during config loading", async () => {
      const mockError = new Error("Config read failed");
      mockReadConfigSources.mockRejectedValue(mockError);

      setupConfigCommand(mockProgram);
      await mockAction([], {});

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
