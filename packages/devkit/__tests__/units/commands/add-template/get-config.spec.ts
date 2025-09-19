import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  CliConfig,
  ConfigurationSource,
} from "../../../../src/utils/configs/schema.js";
import { mocktFn } from "../../../../vitest.setup.js";
import { getConfig } from "../../../../src/commands/add-template/get-config.js";

const {
  mockDeepmerge,
  mockGetConfigFilepath,
  mockReadConfigAtPath,
  mockDevkitError,
} = vi.hoisted(() => ({
  mockDeepmerge: vi.fn(),
  mockGetConfigFilepath: vi.fn(),
  mockReadConfigAtPath: vi.fn(),
  mockDevkitError: vi.fn(),
}));

vi.mock("deepmerge", () => ({
  default: mockDeepmerge,
}));

vi.mock("#utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

vi.mock("#utils/configs/reader.js", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));

vi.mock("#utils/errors/base.js", () => ({
  DevkitError: mockDevkitError,
}));

describe("getConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDevkitError.mockImplementation((message) => new Error(message));
    mockDeepmerge.mockImplementation((_a, b) => b);
    mockGetConfigFilepath.mockResolvedValue("/path/to/config.json");
    mockReadConfigAtPath.mockResolvedValue({ templates: {} });
  });

  it("should throw a DevkitError if source is 'default'", async () => {
    const isGlobal = false;
    const source: ConfigurationSource = "default";
    const config = {};

    await expect(
      getConfig(isGlobal, source as ConfigurationSource, config as CliConfig),
    ).rejects.toThrow(mocktFn("error.config.not.found"));
    expect(mocktFn).toHaveBeenCalledWith("error.config.not.found");
  });

  it("should retrieve and merge the existing global config when isGlobal is true", async () => {
    const isGlobal = true;
    const source: ConfigurationSource = "global";
    const config = {};
    const existingGlobalConfig = { settings: { language: "en" } };

    mockReadConfigAtPath.mockResolvedValue(existingGlobalConfig);

    const result = await getConfig(
      isGlobal,
      source as ConfigurationSource,
      config as CliConfig,
    );

    expect(mockGetConfigFilepath).toHaveBeenCalledWith(true);
    expect(mockReadConfigAtPath).toHaveBeenCalledWith("/path/to/config.json");
    expect(mockDeepmerge).toHaveBeenCalledWith({}, existingGlobalConfig);
    expect(result).toEqual(existingGlobalConfig);
  });

  it("should throw an error if isGlobal is true but global config is not found", async () => {
    const isGlobal = true;
    const source: ConfigurationSource = "global";
    const config = {};

    mockReadConfigAtPath.mockResolvedValue(null);

    await expect(
      getConfig(isGlobal, source as ConfigurationSource, config as CliConfig),
    ).rejects.toThrow(mocktFn("error.config.global.not.found"));
    expect(mocktFn).toHaveBeenCalledWith("error.config.global.not.found");
  });

  it("should return the provided local config when isGlobal is false and source is 'local'", async () => {
    const isGlobal = false;
    const source: ConfigurationSource = "local";
    const localConfig = { templates: { js: { templates: { myTemp: {} } } } };

    const result = await getConfig(
      isGlobal,
      source as ConfigurationSource,
      localConfig as unknown as CliConfig,
    );

    expect(mockDeepmerge).toHaveBeenCalledWith({}, localConfig);
    expect(result).toEqual(localConfig);
  });

  it("should throw an error if isGlobal is false but source is 'global'", async () => {
    const isGlobal = false;
    const source: ConfigurationSource = "global";
    const config = {};

    await expect(
      getConfig(isGlobal, source as ConfigurationSource, config as CliConfig),
    ).rejects.toThrow(mocktFn("error.config.local.not.found"));
    expect(mocktFn).toHaveBeenCalledWith("error.config.local.not.found");
  });
});
