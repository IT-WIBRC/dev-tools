import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupInfoCommand } from "../../../src/commands/info.js";
import { mockSpinner, mocktFn } from "../../../vitest.setup.js";
import { type SystemInfo } from "../../../src/utils/system/info.js";

const { mockCollectSystemInfo, mockHandleErrorAndExit } = vi.hoisted(() => ({
  mockCollectSystemInfo: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

vi.mock("#utils/system/info.js", () => ({
  collectSystemInfo: mockCollectSystemInfo,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("chalk", () => ({
  default: {
    bold: {
      cyan: (str: string) => str,
    },
    yellow: (str: string) => str,
    green: (str: string) => `[GREEN: ${str}]`,
    red: (str: string) => `[RED: ${str}]`,
  },
}));

let consoleOutput: string[] = [];
const originalConsoleLog = console.log;

const mockConsoleLog = vi.fn((output) => {
  consoleOutput.push(String(output));
});

const MOCKED_CLI_VERSION = "1.2.3";
const GLOBAL_PATH = "/home/user/.devkitrc";
const LOCAL_EXPECTED = "info.config.local_expected_location";

const MOCKED_SYSTEM_INFO: SystemInfo = {
  cliVersion: MOCKED_CLI_VERSION,
  runtimeName: "Node.js",
  runtimeVersion: "v20.10.0",
  packageManagerVersion: "npm v10.5.0",
  os: "Linux 6.1.0",
  arch: "x64",
  shell: "/bin/zsh",
  homeDir: "/home/user",
  globalConfig: {
    path: GLOBAL_PATH,
    exists: true,
  },
  localConfig: {
    path: LOCAL_EXPECTED,
    exists: false,
  },
};

describe("setupInfoCommand", () => {
  let mockProgram: any;
  let actionFn: (options: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleOutput = [];

    mocktFn.mockImplementation((key) => key);

    console.log = mockConsoleLog;

    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
      version: vi.fn(() => MOCKED_CLI_VERSION),
    };

    mockCollectSystemInfo.mockResolvedValue(MOCKED_SYSTEM_INFO);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it("should set up the info command correctly", () => {
    setupInfoCommand({ program: mockProgram });
    expect(mockProgram.command).toHaveBeenCalledWith("info");
    expect(mockProgram.alias).toHaveBeenCalledWith("in");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "info.command.description",
    );
  });

  describe("Command Action and printInfo Output", () => {
    beforeEach(() => {
      setupInfoCommand({ program: mockProgram });
    });

    it("should start and stop the spinner and print all structured system info on success", async () => {
      await actionFn({});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith("info.success_message");
      expect(mockCollectSystemInfo).toHaveBeenCalledWith(MOCKED_CLI_VERSION);

      const pad = (label: string) => label.padEnd(27, " ");

      expect(consoleOutput).toEqual([
        "undefined",
        `--- info.header.cli ---`,
        `${pad("info.cli.version")}: ${MOCKED_CLI_VERSION}`,
        "undefined",
        `--- info.header.runtime ---`,
        `${pad("info.runtime.runtime_name")}: ${MOCKED_SYSTEM_INFO.runtimeName}`,
        `${pad("info.runtime.runtime_version")}: ${MOCKED_SYSTEM_INFO.runtimeVersion}`,
        `${pad("info.runtime.package_manager")}: ${MOCKED_SYSTEM_INFO.packageManagerVersion}`,
        "undefined",
        `--- info.header.os_details ---`,
        `${pad("info.os.type_version")}: ${MOCKED_SYSTEM_INFO.os}`,
        `${pad("info.os.architecture")}: ${MOCKED_SYSTEM_INFO.arch}`,
        `${pad("info.os.shell")}: ${MOCKED_SYSTEM_INFO.shell}`,
        `${pad("info.os.home_dir")}: ${MOCKED_SYSTEM_INFO.homeDir}`,
        "undefined",
        `--- info.header.config_files ---`,
        `${pad("info.config.global_path")}: ${GLOBAL_PATH} [GREEN: info.config.found]`,
        `${pad("info.config.local_path")}: ${LOCAL_EXPECTED} [RED: info.config.not_found]`,
        "undefined",
      ]);
    });

    it("should call the error handler if data collection fails", async () => {
      const mockError = new Error("Failed to get info");
      mockCollectSystemInfo.mockRejectedValueOnce(mockError);

      await actionFn({});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).not.toHaveBeenCalled();

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });
  });
});
