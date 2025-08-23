import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupConfigSetCommand } from "../../../src/commands/config/set.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../vitest.setup.js";
import type { CliConfig } from "../../../src/utils/configs/schema.js";
import {
  PackageManagers,
  VALID_CACHE_STRATEGIES,
  TextLanguages,
} from "../../../src/utils/configs/schema.js";

const { mockHandleErrorAndExit, mockSaveGlobalConfig, mockSaveLocalConfig } =
  vi.hoisted(() => ({
    mockHandleErrorAndExit: vi.fn(),
    mockSaveGlobalConfig: vi.fn(),
    mockSaveLocalConfig: vi.fn(),
  }));

let actionFn: any;
vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/configs/writer", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

describe("setupConfigSetCommand", () => {
  let mockProgram: any;
  let config: CliConfig;

  const initialConfig: CliConfig = {
    settings: {
      defaultPackageManager: "npm",
      cacheStrategy: "daily",
      language: "en",
    },
    templates: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    config = JSON.parse(JSON.stringify(initialConfig));
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the config set command correctly", () => {
    setupConfigSetCommand({
      program: mockProgram,
      config,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("set");
    expect(mockProgram.description).toHaveBeenCalledWith(
      `config.set.command.description- options pmValues:${Object.values(
        PackageManagers,
      ).join(", ")}`,
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<settings...>",
      "config.set.argument.description",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "config.set.option.global",
      false,
    );
  });

  it("should update a local config setting by key", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["packageManager", "yarn"];

    await actionFn(settings, { global: false });

    expect(config.settings.defaultPackageManager).toBe("yarn");
    expect(mockSaveLocalConfig).toHaveBeenCalledWith(config);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.bold.green(mocktFn("config.set.success")),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update a local config setting by alias", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["pm", "bun"];

    await actionFn(settings, { global: false });

    expect(config.settings.defaultPackageManager).toBe("bun");
    expect(mockSaveLocalConfig).toHaveBeenCalledWith(config);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.bold.green(mocktFn("config.set.success")),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update multiple local config settings at once", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["cacheStrategy", "never-refresh", "language", "fr"];

    await actionFn(settings, { global: false });

    expect(config.settings.cacheStrategy).toBe("never-refresh");
    expect(config.settings.language).toBe("fr");
    expect(mockSaveLocalConfig).toHaveBeenCalledWith(config);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.bold.green(mocktFn("config.set.success")),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should update global config settings when --global flag is used", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["packageManager", "pnpm"];

    await actionFn(settings, { global: true });

    expect(config.settings.defaultPackageManager).toBe("pnpm");
    expect(mockSaveGlobalConfig).toHaveBeenCalledWith(config);
    expect(mockSaveLocalConfig).not.toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.bold.green(mocktFn("config.set.success")),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw an error if no config file is found", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "default" });
    const settings = ["pm", "npm"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn("error.config.no_file_found")),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid number of arguments", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["defaultPackageManager"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(mocktFn("error.command.set.invalid_arguments_count")),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid key", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["invalidKey", "someValue"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.key", {
          key: "invalidKey",
          keys: "pm, packageManager, cache, cacheStrategy, language, lg",
        }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid value for package manager", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["packageManager", "invalid-pm"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.value", {
          key: "defaultPackageManager",
          options: Object.values(PackageManagers).join(", "),
        }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid value for cache strategy", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["cacheStrategy", "invalid-cache"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.value", {
          key: "cacheStrategy",
          options: VALID_CACHE_STRATEGIES.join(", "),
        }),
      ),
      mockSpinner,
    );
  });

  it("should throw an error for an invalid value for language", async () => {
    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["language", "invalid-lang"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.invalid.value", {
          key: "language",
          options: Object.values(TextLanguages).join(", "),
        }),
      ),
      mockSpinner,
    );
  });

  it("should handle an error during the save operation", async () => {
    const mockError = new Error("Save failed");
    mockSaveLocalConfig.mockRejectedValue(mockError);

    setupConfigSetCommand({ program: mockProgram, config, source: "local" });
    const settings = ["packageManager", "yarn"];

    await actionFn(settings, { global: false });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
