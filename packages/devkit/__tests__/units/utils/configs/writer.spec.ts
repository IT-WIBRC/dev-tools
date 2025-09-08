import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  saveConfig,
  saveCliConfig,
  updateTemplateCacheStrategy,
} from "../../../../src/utils/configs/writer.js";
import { getConfigFilepath } from "../../../../src/utils/configs/path-finder.js";
import { DevkitError, ConfigError } from "../../../../src/utils/errors/base.js";

const { mockWriteJson, mockGetConfigFilepath } = vi.hoisted(() => ({
  mockWriteJson: vi.fn(),
  mockGetConfigFilepath: vi.fn(),
}));

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    writeJson: mockWriteJson,
  },
}));

vi.mock("../../../../src/utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

const mockConfig = {
  templates: {
    en: {
      templates: {
        "test-template": { cacheStrategy: "remote" },
      },
    },
  },
};

describe("Configuration Writer Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveConfig should save the configuration to the specified path", async () => {
    const filePath = "/path/to/config.json";
    const config = { setting: "value" };
    mockWriteJson.mockResolvedValueOnce(undefined);
    await saveConfig(config as any, filePath);
    expect(mockWriteJson).toHaveBeenCalledWith(filePath, config);
  });

  it("saveConfig should throw a DevkitError on write failure", async () => {
    const error = new Error("Write failed");
    mockWriteJson.mockRejectedValue(error);
    await expect(saveConfig({} as any, "file.json")).rejects.toThrow(
      DevkitError,
    );
    await expect(saveConfig({} as any, "file.json")).rejects.toThrow(
      "error.config.save",
    );
  });

  it("saveCliConfig should use getConfigFilepath to get the path and then save the config", async () => {
    mockGetConfigFilepath.mockResolvedValueOnce("/cli/config.json");
    mockWriteJson.mockResolvedValueOnce(undefined);
    await saveCliConfig({} as any, false);
    expect(vi.mocked(getConfigFilepath)).toHaveBeenCalledWith(false);
    expect(mockWriteJson).toHaveBeenCalledWith(
      "/cli/config.json",
      expect.any(Object),
    );
  });

  it("updateTemplateCacheStrategy should update a template's cache strategy and save the config", async () => {
    mockGetConfigFilepath.mockResolvedValueOnce("/project/config.json");
    mockWriteJson.mockResolvedValueOnce(undefined);
    const config = { ...mockConfig };
    await updateTemplateCacheStrategy("test-template", "daily", config as any);
    expect(config.templates.en.templates["test-template"].cacheStrategy).toBe(
      "daily",
    );
    expect(mockWriteJson).toHaveBeenCalledWith(
      "/project/config.json",
      expect.any(Object),
    );
  });

  it("updateTemplateCacheStrategy should throw a ConfigError if no config path is found", async () => {
    mockGetConfigFilepath.mockResolvedValue(null);
    await expect(
      updateTemplateCacheStrategy(
        "test-template",
        "always-refresh",
        mockConfig as any,
      ),
    ).rejects.toThrow(ConfigError);
    await expect(
      updateTemplateCacheStrategy(
        "test-template",
        "never-refresh",
        mockConfig as any,
      ),
    ).rejects.toThrow("error.config.not.found");
  });

  it("updateTemplateCacheStrategy should throw a ConfigError if the template is not found", async () => {
    mockGetConfigFilepath.mockResolvedValue("/project/config.json");
    await expect(
      updateTemplateCacheStrategy(
        "non-existent-template",
        "daily",
        mockConfig as any,
      ),
    ).rejects.toThrow(ConfigError);
    await expect(
      updateTemplateCacheStrategy(
        "non-existent-template",
        "never-refresh",
        mockConfig as any,
      ),
    ).rejects.toThrow("error.template.not_found");
  });
});
