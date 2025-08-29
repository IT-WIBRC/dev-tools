import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConfigError, GitError } from "../../../../src/utils/errors/base.js";
import { handleErrorAndExit } from "../../../../src/utils/errors/handler.js";

const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit was called.");
});

describe("handleErrorAndExit", () => {
  let mockSpinner: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner = { stop: vi.fn() };
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
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
    expect(mockConsoleError).toHaveBeenCalledTimes(expectedLog.length);
    expectedLog.forEach((log, index) => {
      expect(mockConsoleError.mock.calls[index][0]).toBe(log);
    });
    expect(mockExit).toHaveBeenCalledWith(expectedExitCode);
  };

  it("should handle ConfigError with filePath correctly", async () => {
    const error = new ConfigError("Invalid config", "/path/to/config.json");
    const expectedLog = [
      "\nerror.config.generic: Invalid config",
      "File path: /path/to/config.json",
    ];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle GitError with url correctly", async () => {
    const error = new GitError("Clone failed", "https://github.com/repo.git");
    const expectedLog = [
      "\nerror.git.generic: Clone failed",
      "Repository URL: https://github.com/repo.git",
    ];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle a generic Error correctly", async () => {
    const error = new Error("Something went wrong");
    const expectedLog = ["\nerror.unexpected: Something went wrong"];
    await testErrorHandling(error, expectedLog);
  });

  it("should handle an unknown error correctly", async () => {
    const error = "A string error";
    const expectedLog = ["\nerror.unknown"];
    await testErrorHandling(error, expectedLog);
  });
});
