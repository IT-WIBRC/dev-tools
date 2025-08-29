import { vi, describe, it, expect, beforeEach } from "vitest";
import { runCliCommand } from "../../../src/scaffolding/cli-runner.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockExecaCommand, mocktFn } from "../../../vitest.setup.js";

describe("runCliCommand", () => {
  const options = {
    projectName: "my-app",
    packageManager: "npm",
    spinner: {
      text: "",
      start: vi.fn(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute the command correctly with the project name and package manager", async () => {
    const command = "{pm} create vue@latest";
    await runCliCommand({ ...options, command });

    const finalCommand = command.replace("{pm}", options.packageManager);
    const [exec, ...args] = finalCommand.split(" ");
    const expectedArgs = [...args, options.projectName];

    expect(mockExecaCommand).toHaveBeenCalledWith(
      `${exec} ${expectedArgs.join(" ")}`,
      {
        stdio: "inherit",
      },
    );
  });

  it("should throw a DevkitError if the command is empty", async () => {
    const command = "  ";
    await expect(runCliCommand({ ...options, command })).rejects.toThrow(
      DevkitError,
    );
    expect(mocktFn).toHaveBeenCalledWith("error.invalid.command", {
      command: command,
    });
  });

  it("should throw a DevkitError if the command execution fails", async () => {
    const command = "invalid-command-that-will-fail";
    const error = new Error("execa failed");
    mockExecaCommand.mockRejectedValueOnce(error);

    await expect(runCliCommand({ ...options, command })).rejects.toThrow(
      DevkitError,
    );
    expect(mocktFn).toHaveBeenCalledWith("scaffolding.run.fail");
  });
});
