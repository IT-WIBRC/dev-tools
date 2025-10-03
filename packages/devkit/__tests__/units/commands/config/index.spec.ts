import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../../vitest.setup.js";

const {
  mockHandleErrorAndExit,
  mockSetupAddCommand,
  mockSetupRemoveCommand,
  mockSetupUpdateCommand,
  mockSetupListCommand,
  mockHandleGetAction,
  mockHandleSetAction,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockSetupAddCommand: vi.fn(),
  mockSetupRemoveCommand: vi.fn(),
  mockSetupUpdateCommand: vi.fn(),
  mockSetupListCommand: vi.fn(),
  mockHandleSetAction: vi.fn(),
  mockHandleGetAction: vi.fn(),
}));

vi.mock("../../../../src/utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
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

vi.mock("../../../../src/commands/config/set/index.js", () => ({
  handleSetAction: mockHandleSetAction,
}));

vi.mock("../../../../src/commands/config/get/index.js", () => ({
  handleGetAction: mockHandleGetAction,
}));

describe("setupConfigCommand", () => {
  let mockProgram: any;
  let mockAction: (keys: string[], cmdOptions: any) => Promise<void>;

  const DESC_KEY = "commands.config.command.description";
  const NO_COMMAND_WARN_KEY = "warnings.no_command_provided";
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
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn("commands.config.set.option.global"),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-s, --set <value...>",
      mocktFn("commands.config.set.option.bulk"),
      false,
    );
    expect(mockProgram.description).toHaveBeenCalledWith(mocktFn(DESC_KEY));
    expect(mockSetupAddCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupRemoveCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupUpdateCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupListCommand).toHaveBeenCalledWith(mockProgram);
  });

  describe("action handler", () => {
    it("should delegate to warning logic if no keys or options are provided", async () => {
      setupConfigCommand(mockProgram);
      await mockAction([], { global: false });

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(mocktFn(CONFIG_LOADING_KEY)),
      );
      expect(mockSpinner.stop).toHaveBeenCalledOnce();

      expect(mockHandleSetAction).not.toHaveBeenCalled();
      expect(mockHandleGetAction).not.toHaveBeenCalled();

      expect(mockSpinner.warn).toHaveBeenCalledWith(
        mocktFn(NO_COMMAND_WARN_KEY),
      );
    });

    it("should delegate to handleSetAction for --set flag and pass all arguments", async () => {
      setupConfigCommand(mockProgram);

      const cmdOptions = {
        set: ["language", "typescript", "pm", "bun"],
        global: true,
      };
      const keys: string[] = [];
      await mockAction(keys, cmdOptions);

      expect(mockSpinner.stop).toHaveBeenCalledOnce();
      expect(mockHandleGetAction).not.toHaveBeenCalled();

      expect(mockHandleSetAction).toHaveBeenCalledWith(
        cmdOptions.set,
        true,
        mockSpinner,
      );
    });

    it("should delegate to handleGetAction when keys are provided (GET functionality)", async () => {
      setupConfigCommand(mockProgram);
      const keys = ["language", "pm"];
      const cmdOptions = { global: false };

      await mockAction(keys, cmdOptions);

      expect(mockSpinner.stop).toHaveBeenCalledOnce();
      expect(mockHandleSetAction).not.toHaveBeenCalled();

      expect(mockHandleGetAction).toHaveBeenCalledWith(
        keys,
        false,
        mockSpinner,
      );
    });

    it("should handle errors gracefully by calling handleErrorAndExit", async () => {
      const mockError = new Error("Config action failed");

      mockHandleSetAction.mockRejectedValue(mockError);

      setupConfigCommand(mockProgram);

      await mockAction([], { set: ["a", "b"] });

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );

      expect(mockSpinner.stop).toHaveBeenCalledOnce();
    });
  });
});
