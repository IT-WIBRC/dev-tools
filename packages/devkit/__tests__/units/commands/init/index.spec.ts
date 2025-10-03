import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupInitCommand } from "../../../../src/commands/init/index.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import type { SetupCommandOptions } from "../../../../src/utils/schema/schema.js";
import { ConfigError } from "../../../../src/utils/errors/base.js";

const { mockHandleErrorAndExit, mockHandleGlobalInit, mockHandleLocalInit } =
  vi.hoisted(() => ({
    mockHandleErrorAndExit: vi.fn(),
    mockHandleGlobalInit: vi.fn(),
    mockHandleLocalInit: vi.fn(),
  }));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("../../../../src/commands/init/logic.js", () => ({
  handleGlobalInit: mockHandleGlobalInit,
  handleLocalInit: mockHandleLocalInit,
}));

const CMD_DESCRIPTION_KEY = "commands.config.init.command.description";
const OPT_LOCAL_KEY = "commands.config.init.option.local";
const OPT_GLOBAL_KEY = "commands.config.init.option.global";
const ERROR_INIT_MUTUAL_EXCLUSION_KEY = "errors.config.init_local_and_global";

const callAction = (local: boolean, global: boolean) => {
  return actionFn({ local, global });
};

describe("setupInitCommand", () => {
  let mockProgram: any;
  let setupOptions: SetupCommandOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
    setupOptions = { program: mockProgram };
  });

  it("should set up the init command with correct arguments and options", () => {
    setupInitCommand(setupOptions);

    expect(mockProgram.command).toHaveBeenCalledWith("init");
    expect(mockProgram.alias).toHaveBeenCalledWith("i");
    expect(mockProgram.description).toHaveBeenCalledWith(
      mocktFn(CMD_DESCRIPTION_KEY),
    );

    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --local",
      mocktFn(OPT_LOCAL_KEY),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn(OPT_GLOBAL_KEY),
      false,
    );
  });

  describe("action handler", () => {
    beforeEach(() => {
      setupInitCommand(setupOptions);
    });

    it("should default to calling handleLocalInit when no options are provided", async () => {
      await callAction(false, false);

      expect(mockHandleLocalInit).toHaveBeenCalledWith(mockSpinner);
      expect(mockHandleGlobalInit).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should call handleLocalInit when the --local option is set", async () => {
      await callAction(true, false);

      expect(mockHandleLocalInit).toHaveBeenCalledWith(mockSpinner);
      expect(mockHandleGlobalInit).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should call handleGlobalInit when the --global option is set", async () => {
      await callAction(false, true);

      expect(mockHandleGlobalInit).toHaveBeenCalledWith(mockSpinner);
      expect(mockHandleLocalInit).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should throw ConfigError and call handleErrorAndExit when both --local and --global are set", async () => {
      await callAction(true, true);

      expect(mockHandleGlobalInit).not.toHaveBeenCalled();
      expect(mockHandleLocalInit).not.toHaveBeenCalled();

      expect(mockHandleErrorAndExit).toHaveBeenCalledTimes(1);
      const errorCalled = mockHandleErrorAndExit.mock.calls[0]![0];

      expect(errorCalled).toBeInstanceOf(ConfigError);
      expect(errorCalled.message).toBe(
        mocktFn(ERROR_INIT_MUTUAL_EXCLUSION_KEY),
      );
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        errorCalled,
        mockSpinner,
      );
    });

    it("should catch and handle errors from handleGlobalInit", async () => {
      const mockError = new Error("Global initialization failed");
      mockHandleGlobalInit.mockRejectedValue(mockError);

      await callAction(false, true);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should catch and handle errors from handleLocalInit", async () => {
      const mockError = new Error("Local initialization failed");
      mockHandleLocalInit.mockRejectedValue(mockError);

      await callAction(true, false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
