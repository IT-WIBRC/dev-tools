import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleErrorAndExit } from "../../../../src/utils/errors/handler.js";
import {
  ConfigError,
  GitError,
  DevkitError,
} from "../../../../src/utils/errors/base.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";
import type { ErrorType } from "../../../../src/utils/logger.js";

mockLogger.dimmed = vi.fn();

const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit was called.");
});

describe("handleErrorAndExit", () => {
  let mockSpinner: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner = { stop: vi.fn() };
  });

  const testErrorHandling = async (
    error: unknown,
    expectedErrorCall: { message: string; type: ErrorType },
    expectedDimmedCalls: string[] = [],
    expectedExitCode = 1,
  ) => {
    try {
      handleErrorAndExit(error, mockSpinner);
    } catch (e: any) {
      expect(e.message).toBe("process.exit was called.");
    }

    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(expectedExitCode);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expectedErrorCall.message,
      expectedErrorCall.type,
    );

    expect(mockLogger.dimmed).toHaveBeenCalledTimes(expectedDimmedCalls.length);
    expectedDimmedCalls.forEach((log, index) => {
      expect(mockLogger.dimmed.mock.calls[index]![0]).toBe(log);
    });
  };

  it("should handle ConfigError with filePath correctly", async () => {
    const error = new ConfigError("Invalid config", "/path/to/config.json");
    const expectedErrorCall = {
      message: `error.config.generic: Invalid config`,
      type: "CONFIG" as ErrorType,
    };
    const expectedDimmedCalls = ["File path: /path/to/config.json"];

    await testErrorHandling(error, expectedErrorCall, expectedDimmedCalls);
  });

  it("should handle GitError with url correctly", async () => {
    const error = new GitError("Clone failed", "https://github.com/repo.git");
    const expectedErrorCall = {
      message: `error.git.generic: Clone failed`,
      type: "GIT" as ErrorType,
    };
    const expectedDimmedCalls = ["Repository URL: https://github.com/repo.git"];

    await testErrorHandling(error, expectedErrorCall, expectedDimmedCalls);
  });

  it("should handle DevkitError correctly", async () => {
    const error = new DevkitError("CLI specific issue");
    const expectedErrorCall = {
      message: `error.devkit_specific: CLI specific issue`,
      type: "DEV" as ErrorType,
    };

    await testErrorHandling(error, expectedErrorCall);
  });

  it("should handle a generic Error correctly", async () => {
    const error = new Error("Something went wrong");
    const expectedErrorCall = {
      message: `error.unexpected: Something went wrong`,
      type: "ERR" as ErrorType,
    };

    await testErrorHandling(error, expectedErrorCall);
  });

  it("should handle an unknown error correctly", async () => {
    const error = "A string error";
    const expectedErrorCall = {
      message: "error.unknown",
      type: "UNKNOWN" as ErrorType,
    };

    await testErrorHandling(error, expectedErrorCall);
  });

  it("should log the cause if the error has one", async () => {
    const causeError = new Error("Underlying system failure");
    const error = new ConfigError("Invalid config", "/path/to/config.json", {
      cause: causeError,
    });
    const expectedErrorCall = {
      message: `error.config.generic: Invalid config`,
      type: "CONFIG" as ErrorType,
    };
    const expectedDimmedCalls = [
      "File path: /path/to/config.json",
      "Cause: Underlying system failure",
    ];

    await testErrorHandling(error, expectedErrorCall, expectedDimmedCalls);
  });
});
