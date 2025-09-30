import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  defaultCliConfig,
  type CliConfig,
} from "../../../../src/utils/schema/schema.js";
import { collectSystemInfo } from "../../../../src/core/info/info.js";
import { mocktFn, mockExeca } from "../../../../vitest.setup.js";

const {
  mockReadAndMergeConfigs,
  mockGetPackageManager,
  mockFindGlobalConfigFile,
  mockFindLocalConfigFile,
  mockOs,
  MOCKED_CLI_VERSION,
  MOCKED_HOME_DIR,
  MOCKED_OS_TYPE,
  MOCKED_OS_RELEASE,
  MOCKED_ARCH,
  MOCKED_NODE_VERSION,
  MOCKED_BUN_VERSION,
  MOCKED_SHELL,
} = vi.hoisted(() => {
  const MOCKED_CLI_VERSION = "1.0.0-test";
  const MOCKED_HOME_DIR = "/home/testuser";
  const MOCKED_OS_TYPE = "Linux";
  const MOCKED_OS_RELEASE = "5.15.0";
  const MOCKED_ARCH = "x64";
  const MOCKED_NODE_VERSION = "v20.10.0";
  const MOCKED_BUN_VERSION = "1.1.8";
  const MOCKED_SHELL = "/bin/bash";

  return {
    mockReadAndMergeConfigs: vi.fn(),
    mockGetPackageManager: vi.fn(),
    mockFindGlobalConfigFile: vi.fn(),
    mockFindLocalConfigFile: vi.fn(),
    mockOs: {
      homedir: vi.fn(() => MOCKED_HOME_DIR),
      type: vi.fn(() => MOCKED_OS_TYPE),
      release: vi.fn(() => MOCKED_OS_RELEASE),
      arch: vi.fn(() => MOCKED_ARCH),
    },
    MOCKED_CLI_VERSION,
    MOCKED_HOME_DIR,
    MOCKED_OS_TYPE,
    MOCKED_OS_RELEASE,
    MOCKED_ARCH,
    MOCKED_NODE_VERSION,
    MOCKED_BUN_VERSION,
    MOCKED_SHELL,
  };
});

vi.mock("../../../../src/core/config/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

vi.mock("#utils/package-manager/index.js", () => ({
  getPackageManager: mockGetPackageManager,
}));

vi.mock("../../../../src/core/config/search.js", () => ({
  findGlobalConfigFile: mockFindGlobalConfigFile,
  findLocalConfigFile: mockFindLocalConfigFile,
}));

vi.mock("os", () => ({
  default: mockOs,
}));

vi.spyOn(process, "version", "get").mockReturnValue(MOCKED_NODE_VERSION);
vi.spyOn(process, "env", "get").mockReturnValue({
  SHELL: MOCKED_SHELL,
});

const mockGlobalBun = (version: string | undefined) => {
  if (version) {
    (globalThis as any).Bun = {
      version: version,
    };
  } else {
    delete (globalThis as any).Bun;
  }
};

const NEW_GLOBAL_CONFIG_KEY = "commands.info.config.global_expected_location";
const NEW_LOCAL_CONFIG_KEY = "commands.info.config.local_expected_location";
const NEW_SHELL_UNKNOWN_KEY = "commands.info.shell.unknown";
const NEW_PM_NOT_FOUND_KEY = "errors.system.info_package_manager_not_found";

describe("collectSystemInfo", () => {
  beforeEach(() => {
    mockReadAndMergeConfigs.mockResolvedValue({
      config: defaultCliConfig,
    });
    mockGetPackageManager.mockResolvedValue(null);
    mockExeca.mockResolvedValue({ stdout: "1.2.3" });
    mockFindGlobalConfigFile.mockResolvedValue(null);
    mockFindLocalConfigFile.mockResolvedValue(null);
  });

  afterEach(() => {
    mockGlobalBun(undefined);
  });

  describe("Configuration File Paths", () => {
    it("should report config paths and 'exists: false' when no files are found", async () => {
      mockFindGlobalConfigFile.mockResolvedValueOnce(null);
      mockFindLocalConfigFile.mockResolvedValueOnce(null);

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.globalConfig.exists).toBe(false);
      expect(info.localConfig.exists).toBe(false);

      expect(info.globalConfig.path).toBe(NEW_GLOBAL_CONFIG_KEY);
      expect(info.localConfig.path).toBe(NEW_LOCAL_CONFIG_KEY);

      expect(mockReadAndMergeConfigs).toHaveBeenCalledWith({
        mergeAll: false,
        forceGlobal: false,
      });
    });

    it("should report the exact path and 'exists: true' when both files are found", async () => {
      const globalPath = `${MOCKED_HOME_DIR}/.devkitrc`;
      const localPath = "/project/path/.devkit.json";

      mockFindGlobalConfigFile.mockResolvedValueOnce(globalPath);
      mockFindLocalConfigFile.mockResolvedValueOnce(localPath);

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.globalConfig).toEqual({
        path: globalPath,
        exists: true,
      });
      expect(info.localConfig).toEqual({
        path: localPath,
        exists: true,
      });
    });
  });

  describe("System and Runtime Data", () => {
    it("should correctly collect and format static system and runtime info in a Node.js environment", async () => {
      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.cliVersion).toBe(MOCKED_CLI_VERSION);
      expect(info.runtimeName).toBe("Node.js");
      expect(info.runtimeVersion).toBe(MOCKED_NODE_VERSION);

      expect(info.homeDir).toBe(MOCKED_HOME_DIR);
      expect(info.os).toBe(`${MOCKED_OS_TYPE} ${MOCKED_OS_RELEASE}`);
      expect(info.arch).toBe(MOCKED_ARCH);
      expect(info.shell).toBe(MOCKED_SHELL);
    });

    it("should correctly collect and format static system and runtime info in a Bun environment", async () => {
      mockGlobalBun(MOCKED_BUN_VERSION);

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.cliVersion).toBe(MOCKED_CLI_VERSION);
      expect(info.runtimeName).toBe("Bun");
      expect(info.runtimeVersion).toBe(`v${MOCKED_BUN_VERSION}`);

      expect(info.homeDir).toBe(MOCKED_HOME_DIR);
      expect(info.os).toBe(`${MOCKED_OS_TYPE} ${MOCKED_OS_RELEASE}`);
      expect(info.arch).toBe(MOCKED_ARCH);
      expect(info.shell).toBe(MOCKED_SHELL);
    });

    it("should fall back to 'commands.info.shell.unknown' if shell environment variables are missing", async () => {
      vi.spyOn(process, "env", "get").mockReturnValueOnce({});

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.shell).toBe(NEW_SHELL_UNKNOWN_KEY);
    });
  });

  describe("Package Manager Version Priority", () => {
    const customConfig: CliConfig = {
      ...defaultCliConfig,
      settings: {
        ...defaultCliConfig.settings,
        defaultPackageManager: "yarn",
      },
    };

    it("Priority 1: Should use package manager from config settings (highest priority)", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({ config: customConfig });
      mockGetPackageManager.mockResolvedValueOnce("pnpm");
      mockExeca.mockImplementationOnce((cmd) =>
        cmd === "yarn"
          ? Promise.resolve({ stdout: "1.22.19" })
          : Promise.reject(new Error("wrong cmd")),
      );

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.packageManagerVersion).toBe("yarn v1.22.19");
      expect(mockExeca).toHaveBeenCalledWith("yarn", ["--version"]);
    });

    it("Priority 2: Should use detected package manager when config does not specify one", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: {},
      });
      mockGetPackageManager.mockResolvedValueOnce("pnpm");
      mockExeca.mockImplementationOnce((cmd) =>
        cmd === "pnpm"
          ? Promise.resolve({ stdout: "8.15.5" })
          : Promise.reject(new Error("wrong cmd")),
      );

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.packageManagerVersion).toBe("pnpm v8.15.5");
      expect(mockExeca).toHaveBeenCalledWith("pnpm", ["--version"]);
    });

    it("Priority 3: Should use 'bun' default when config is missing and nothing is detected", async () => {
      vi.restoreAllMocks();
      vi.spyOn(process, "version", "get").mockReturnValue(MOCKED_NODE_VERSION);
      vi.spyOn(process, "env", "get").mockReturnValue({ SHELL: MOCKED_SHELL });
      vi.mock("os", () => ({ default: mockOs }));

      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: defaultCliConfig,
      });
      mockGetPackageManager.mockResolvedValueOnce(null);
      mockExeca.mockImplementationOnce((cmd) =>
        cmd === "bun"
          ? Promise.resolve({ stdout: "10.2.4" })
          : Promise.reject(new Error("wrong cmd")),
      );

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.packageManagerVersion).toBe("bun v10.2.4");
      expect(mockExeca).toHaveBeenCalledWith("bun", ["--version"]);
    });

    it("Should return a not found error message if execa fails for the determined manager", async () => {
      const bunConfig: CliConfig = {
        ...defaultCliConfig,
        settings: {
          ...defaultCliConfig.settings,
          defaultPackageManager: "bun",
        },
      };
      mockReadAndMergeConfigs.mockResolvedValueOnce({ config: bunConfig });
      mockExeca.mockRejectedValueOnce(new Error("bun not found"));

      const info = await collectSystemInfo(MOCKED_CLI_VERSION);

      expect(info.packageManagerVersion).toBe(
        mocktFn(NEW_PM_NOT_FOUND_KEY, { manager: "bun" }),
      );
    });
  });
});
