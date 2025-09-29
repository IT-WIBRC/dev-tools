import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import { execute, executeCommand } from "../../../src/utils/shell.js";
import type { Options } from "execa";

const mockExecaResult = {
  stdout: "mock output",
  stderr: "",
  exitCode: 0,
  failed: false,
  command: "mock command",
  killed: false,
  signal: undefined,
  timedOut: false,
  isCanceled: false,
  isTerminated: false,
};

const { mockExecaCommand, mockExeca } = vi.hoisted(() => ({
  mockExecaCommand: vi.fn(),
  mockExeca: vi.fn(),
}));

vi.mock("execa", () => ({
  execa: mockExeca,
  execaCommand: mockExecaCommand,
}));

describe("shell utilities", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should call execa with the correct command, args, and no options", async () => {
      mockExeca.mockResolvedValue(mockExecaResult);
      mockExecaCommand.mockResolvedValue(mockExecaResult);
      const command = "git";
      const args = ["status", "--short"];

      await execute(command, args);

      expect(mockExeca).toHaveBeenCalledOnce();
      expect(mockExeca).toHaveBeenCalledWith(command, args, undefined);
      expect(mockExeca).toHaveBeenCalledTimes(1);
    });

    it("should call execa with the correct command, args, and options", async () => {
      const command = "npm";
      const args = ["install"];
      const options = { cwd: "/tmp/project", env: { NODE_ENV: "test" } };

      await execute(command, args, options);

      expect(mockExeca).toHaveBeenCalledWith(command, args, options);
      expect(mockExeca).toHaveBeenCalledTimes(1);
    });

    it("should return the result from execa", async () => {
      const result = await execute("ls", ["-a"]);
      expect(result).toEqual(mockExecaResult);
    });
  });

  describe("executeCommand", () => {
    it("should call execaCommand with the correct command string and no options", async () => {
      const commandString = "npm run lint";

      await executeCommand(commandString);

      expect(mockExecaCommand).toHaveBeenCalledWith(commandString, undefined);
      expect(mockExecaCommand).toHaveBeenCalledTimes(1);
    });

    it("should call execaCommand with the correct command string and options", async () => {
      const commandString = "echo 'hello world'";
      const options = { shell: true, stdio: "inherit" } as Options;

      await executeCommand(commandString, options);

      expect(mockExecaCommand).toHaveBeenCalledWith(commandString, options);
      expect(mockExecaCommand).toHaveBeenCalledTimes(1);
    });

    it("should return the result from execaCommand", async () => {
      const result = await executeCommand("whoami");
      expect(result).toEqual(mockExecaResult);
    });
  });
});
