import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../../vitest.setup.js";

const {
  mockReadAndMergeConfigs,
  mockHandleNonInteractiveSettingsUpdate,
  mockHandleErrorAndExit,
  mockSetupAddCommand,
  mockSetupRemoveCommand,
  mockSetupUpdateCommand,
  mockSetupListCommand,
} = vi.hoisted(() => ({
  mockReadAndMergeConfigs: vi.fn(),
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
  readAndMergeConfigs: mockReadAndMergeConfigs,
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
  const GLOBAL_OPT_KEY = "commands.config.set.option.global";
  const SET_BULK_OPT_KEY = "commands.config.set.option.bulk";
  const NO_COMMAND_WARN_KEY = "warnings.no_command_provided";
  const SET_SUCCESS_KEY = "messages.success.config_updated";
  const GET_SUCCESS_KEY = "messages.success.config_updated";
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
  });

  it("should set up the config command with correct options and subcommands", () => {
    setupConfigCommand(mockProgram);

    expect(mockProgram.command).toHaveBeenCalledWith("config [keys...]");
    expect(mockProgram.alias).toHaveBeenCalledWith("conf");
    // Updated translation key
    expect(mockProgram.description).toHaveBeenCalledWith(mocktFn(DESC_KEY));
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn(GLOBAL_OPT_KEY),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-s, --set <value...>",
      mocktFn(SET_BULK_OPT_KEY),
      false,
    );
    expect(mockSetupAddCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupRemoveCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupUpdateCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupListCommand).toHaveBeenCalledWith(mockProgram);
  });

  describe("action handler", () => {
    it("should default to warning if no keys or options are provided (non-interactive mode)", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });

      setupConfigCommand(mockProgram);
      await mockAction([], { global: false });

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(mocktFn(CONFIG_LOADING_KEY)),
      );
      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });

      expect(mockSpinner.warn).toHaveBeenCalledOnce();

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        mocktFn(NO_COMMAND_WARN_KEY),
      );
    });

    it("should call handleNonInteractiveSettingsUpdate for --set flag and succeed", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        source: "local",
      });

      setupConfigCommand(mockProgram);

      const cmdOptions = {
        set: ["language", "typescript", "pm", "bun"],
        global: false,
      };
      await mockAction([], cmdOptions);

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "language",
        "typescript",
        false,
      );

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "pm",
        "bun",
        false,
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(SET_SUCCESS_KEY)),
      );
    });

    it("should fail for invalid --set format (odd number of arguments)", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        source: "local",
      });

      setupConfigCommand(mockProgram);

      const cmdOptions = { set: ["language"], global: false };
      await mockAction([], cmdOptions);

      expect(mockHandleNonInteractiveSettingsUpdate).not.toHaveBeenCalled();

      expect(mockSpinner.fail).toHaveBeenCalledWith(
        mockLogger.colors.redBright(mocktFn(INVALID_FORMAT_KEY)),
      );
    });

    it("should print a single config value when a key is provided (GET functionality)", async () => {
      const mockConfig = {
        settings: { language: "typescript" },
        templates: {},
      };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });

      setupConfigCommand(mockProgram);
      await mockAction(["language"], {});

      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.yellowBold("language") + ": " + "typescript",
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(GET_SUCCESS_KEY)),
      );
    });

    it("should print multiple config values when multiple keys are provided (GET functionality)", async () => {
      const mockConfig = {
        settings: {
          language: "typescript",
          packageManager: "bun",
        },
        templates: {},
      };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });

      setupConfigCommand(mockProgram);
      await mockAction(["language", "packageManager"], {});

      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.yellowBold("language") + ": " + "typescript",
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        mockLogger.colors.yellowBold("packageManager") + ": " + "bun",
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.green(mocktFn(GET_SUCCESS_KEY)),
      );
    });

    it("should handle a non-existent key gracefully (GET functionality)", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
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

    it("should handle errors gracefully", async () => {
      const mockError = new Error("Config read failed");
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

      setupConfigCommand(mockProgram);
      await mockAction([], {});

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
