import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleErrorAndExit } from "../../../../src/utils/errors/handler.js";
import { ConfigError, GitError } from "../../../../src/utils/errors/base.js";
import { mockLogger } from "../../../../vitest.setup.js";

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
    expectedLog: string[],
    expectedExitCode = 1,
  ) => {
    try {
      handleErrorAndExit(error, mockSpinner);
    } catch (e: any) {
      expect(e.message).toBe("process.exit was called.");
    }

    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledTimes(expectedLog.length);
    expectedLog.forEach((log, index) => {
      expect(mockLogger.error.mock.calls[index]![0]).toBe(log);
    });
    expect(mockExit).toHaveBeenCalledWith(expectedExitCode);
  };

  it("should handle ConfigError with filePath correctly", async () => {
    const error = new ConfigError("Invalid config", "/path/to/config.json");
    const expectedLog = [
      "error.config.generic: Invalid config",
      "File path: /path/to/config.json",
    ];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle GitError with url correctly", async () => {
    const error = new GitError("Clone failed", "https://github.com/repo.git");
    const expectedLog = [
      "error.git.generic: Clone failed",
      "Repository URL: https://github.com/repo.git",
    ];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle a generic Error correctly", async () => {
    const error = new Error("Something went wrong");
    const expectedLog = ["error.unexpected: Something went wrong"];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle an unknown error correctly", async () => {
    const error = "A string error";
    const expectedLog = ["error.unknown"];
    await testErrorHandling(error, expectedLog);
  });
});
