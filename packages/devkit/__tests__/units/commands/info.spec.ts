import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupInfoCommand } from "../../../src/commands/info.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../vitest.setup.js";
import { type SystemInfo } from "../../../src/core/info/info.js";

const { mockCollectSystemInfo, mockHandleErrorAndExit } = vi.hoisted(() => ({
  mockCollectSystemInfo: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

vi.mock("#core/info/info.js", () => ({
  collectSystemInfo: mockCollectSystemInfo,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

let consoleOutput: string[] = [];
const originalConsoleLog = mockLogger.log;

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

const CMD_DESCRIPTION_KEY = "commands.info.command.description";
const SUCCESS_MESSAGE_KEY = "messages.success.info_collected";
const CLI_HEADER_KEY = "commands.info.header.cli";
const CLI_VERSION_KEY = "commands.info.cli.version";
const RUNTIME_HEADER_KEY = "commands.info.header.runtime";
const RUNTIME_NAME_KEY = "commands.info.runtime.runtime_name";
const RUNTIME_VERSION_KEY = "commands.info.runtime.runtime_version";
const PACKAGE_MANAGER_KEY = "commands.info.runtime.package_manager";
const OS_HEADER_KEY = "commands.info.header.os_details";
const OS_TYPE_VERSION_KEY = "commands.info.os.type_version";
const OS_ARCHITECTURE_KEY = "commands.info.os.architecture";
const OS_SHELL_KEY = "commands.info.os.shell";
const OS_HOME_DIR_KEY = "commands.info.os.home_dir";
const CONFIG_HEADER_KEY = "commands.info.header.config_files";
const CONFIG_GLOBAL_PATH_KEY = "commands.info.config.global_path";
const CONFIG_LOCAL_PATH_KEY = "commands.info.config.local_path";
const CONFIG_FOUND_KEY = "commands.info.config.found";
const CONFIG_NOT_FOUND_KEY = "commands.info.config.not_found";

describe("setupInfoCommand", () => {
  let mockProgram: any;
  let actionFn: (options: unknown) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleOutput = [];

    mocktFn.mockImplementation((key) => key);

    mockLogger.log = mockConsoleLog;

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
    expect(mockProgram.description).toHaveBeenCalledWith(CMD_DESCRIPTION_KEY);
  });

  describe("Command Action and printInfo Output", () => {
    beforeEach(() => {
      setupInfoCommand({ program: mockProgram });
    });

    it("should start and stop the spinner and print all structured system info on success", async () => {
      await actionFn({});

      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(SUCCESS_MESSAGE_KEY);
      expect(mockCollectSystemInfo).toHaveBeenCalledWith(MOCKED_CLI_VERSION);

      const pad = (label: string) => label.padEnd(27, " ");

      expect(consoleOutput).toEqual([
        "\n",
        `--- ${CLI_HEADER_KEY} ---`,
        `${pad(CLI_VERSION_KEY)}: ${MOCKED_CLI_VERSION}`,
        "\n",
        `--- ${RUNTIME_HEADER_KEY} ---`,
        `${pad(RUNTIME_NAME_KEY)}: ${MOCKED_SYSTEM_INFO.runtimeName}`,
        `${pad(RUNTIME_VERSION_KEY)}: ${MOCKED_SYSTEM_INFO.runtimeVersion}`,
        `${pad(PACKAGE_MANAGER_KEY)}: ${MOCKED_SYSTEM_INFO.packageManagerVersion}`,
        "\n",
        `--- ${OS_HEADER_KEY} ---`,
        `${pad(OS_TYPE_VERSION_KEY)}: ${MOCKED_SYSTEM_INFO.os}`,
        `${pad(OS_ARCHITECTURE_KEY)}: ${MOCKED_SYSTEM_INFO.arch}`,
        `${pad(OS_SHELL_KEY)}: ${MOCKED_SYSTEM_INFO.shell}`,
        `${pad(OS_HOME_DIR_KEY)}: ${MOCKED_SYSTEM_INFO.homeDir}`,
        "\n",
        `--- ${CONFIG_HEADER_KEY} ---`,
        `${pad(CONFIG_GLOBAL_PATH_KEY)}: ${GLOBAL_PATH} ${CONFIG_FOUND_KEY}`,
        `${pad(CONFIG_LOCAL_PATH_KEY)}: ${LOCAL_EXPECTED} ${CONFIG_NOT_FOUND_KEY}`,
        "\n",
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
