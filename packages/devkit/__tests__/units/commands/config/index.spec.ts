import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.ts";

const {
  mockReadAndMergeConfigs,
  mockHandleNonInteractiveSettingsUpdate,
  mockHandleNonInteractiveTemplateUpdate,
  mockHandleInteractiveConfig,
  mockHandleErrorAndExit,
} = vi.hoisted(() => ({
  mockReadAndMergeConfigs: vi.fn(),
  mockHandleNonInteractiveTemplateUpdate: vi.fn(),
  mockHandleNonInteractiveSettingsUpdate: vi.fn(),
  mockHandleInteractiveConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveSettingsUpdate: mockHandleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate: mockHandleNonInteractiveTemplateUpdate,
}));

vi.mock("../../../../src/commands/config/prompts.js", () => ({
  handleInteractiveConfig: mockHandleInteractiveConfig,
}));

vi.mock("../../../../src/utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

describe("setupConfigCommand", () => {
  let mockProgram: any;
  let mockAction: (cmdOptions: any) => Promise<void>;

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

  it("should set up the config command with correct options", () => {
    const options = { program: mockProgram };
    setupConfigCommand(options);

    expect(mockProgram.command).toHaveBeenCalledWith("config");
    expect(mockProgram.alias).toHaveBeenCalledWith("cf");
    expect(mockProgram.description).toHaveBeenCalledWith(
      mocktFn("config.command.description"),
    );
    expect(mockProgram.option).toHaveBeenCalledTimes(9);
  });

  describe("action handler", () => {
    it("should call handleInteractiveConfig in interactive mode", async () => {
      const mockConfig = { settings: {}, templates: {} };
      mockReadAndMergeConfigs.mockResolvedValue({
        config: mockConfig,
        global: false,
      });

      const options = { program: mockProgram };
      setupConfigCommand(options);

      await mockAction({ global: false });

      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        forceGlobal: false,
      });
      expect(mockSpinner.start).toHaveBeenCalledOnce();
      expect(mockHandleInteractiveConfig).toHaveBeenCalledWith(
        mockConfig,
        false,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        "config.interactive.success",
      );
    });

    it("should call handleNonInteractiveSettingsUpdate for --set flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        global: false,
      });

      const options = { program: mockProgram };
      setupConfigCommand(options);

      const cmdOptions = { set: ["language", "typescript"], global: false };
      await mockAction(cmdOptions);

      expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
        "language",
        "typescript",
        false,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith("config.set.success");
    });

    it("should call handleNonInteractiveTemplateUpdate for --template flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        global: false,
      });

      const options = { program: mockProgram };
      setupConfigCommand(options);

      const cmdOptions = {
        template: ["typescript", "my-template"],
        description: "A cool template",
        location: "http://example.com",
        alias: "mt",
        cacheStrategy: "network_only",
        packageManager: "bun",
        global: false,
      };
      await mockAction(cmdOptions);

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "typescript",
        "my-template",
        {
          description: "A cool template",
          location: "http://example.com",
          alias: "mt",
          cacheStrategy: "network_only",
          packageManager: "bun",
          newName: undefined,
        },
        false,
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn("config.update.success", { templateName: "my-template" }),
      );
    });

    it("should display the correct success message for a new template name", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: {},
        global: false,
      });

      const options = { program: mockProgram };
      setupConfigCommand(options);

      const cmdOptions = {
        template: ["typescript", "old-name"],
        newName: "new-name",
        global: false,
      };
      await mockAction(cmdOptions);

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        "config.update.success_name- options oldName:old-name, newName:new-name",
      );
    });

    it("should handle errors gracefully", async () => {
      const mockError = new Error("Config read failed");
      mockReadAndMergeConfigs.mockRejectedValue(mockError);

      const options = { program: mockProgram };
      setupConfigCommand(options);

      await mockAction({});

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
