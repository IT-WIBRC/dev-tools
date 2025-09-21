import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../../vitest.setup.js";

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

vi.mock("#utils/configs/loader.js", () => ({
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

vi.spyOn(console, "log").mockImplementation(() => {});

describe("setupConfigCommand", () => {
  let mockProgram: any;
  let mockAction: (keys: string[], cmdOptions: any) => Promise<void>;

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
    expect(mockProgram.alias).toHaveBeenCalledWith("cf");
    expect(mockProgram.description).toHaveBeenCalledWith(
      mocktFn("config.command.description"),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn("config.update.option.global"),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-s, --set <value...>",
      mocktFn("config.set.option.bulk"),
      false,
    );
    expect(mockSetupAddCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupRemoveCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupUpdateCommand).toHaveBeenCalledWith(mockProgram);
    expect(mockSetupListCommand).toHaveBeenCalledWith(mockProgram);
  });

  describe("action handler", () => {
    it("should call handleInteractiveConfig in interactive mode", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });

      setupConfigCommand(mockProgram);
      await mockAction([], { global: false });

      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });
      expect(mockSpinner.start).toHaveBeenCalledOnce();

      expect(mockSpinner.warn).toHaveBeenCalledOnce();
      expect(mockSpinner.warn).toHaveBeenCalledWith(
        mockChalk.green("warning.no_command_or_option_provided"),
      );
    });

    it("should call handleNonInteractiveSettingsUpdate for --set flag and succeed", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        source: "local",
      });

      setupConfigCommand(mockProgram);

      const cmdOptions = { set: ["language", "typescript"], global: false };
      await mockAction([], cmdOptions);

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "language",
        "typescript",
        false,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.green("config.set.success"),
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
        mockChalk.redBright("error.command.set.invalid_format"),
      );
    });

    it("should print a single config value when a key is provided", async () => {
      const mockConfig = {
        settings: { language: "typescript" },
        templates: {},
      };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });
      const consoleLogSpy = vi.spyOn(console, "log");

      setupConfigCommand(mockProgram);
      await mockAction(["language"], {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow.bold("language") + ": " + "typescript",
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.green("config.get.success"),
      );
    });

    it("should print multiple config values when multiple keys are provided", async () => {
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
      const consoleLogSpy = vi.spyOn(console, "log");

      setupConfigCommand(mockProgram);
      await mockAction(["language", "packageManager"], {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow.bold("language") + ": " + "typescript",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow.bold("packageManager") + ": " + "bun",
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.green("config.get.success"),
      );
    });

    it("should handle a non-existent key gracefully", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        source: "local",
      });
      const consoleLogSpy = vi.spyOn(console, "log");

      setupConfigCommand(mockProgram);
      await mockAction(["nonexistent_key"], {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.redBright(
          mocktFn("config.get.not_found", {
            key: "nonexistent_key",
          }),
        ),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.green("config.get.success"),
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
