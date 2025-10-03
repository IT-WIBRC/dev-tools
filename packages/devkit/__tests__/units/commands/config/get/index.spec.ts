import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleGetAction } from "../../../../../src/commands/config/get/index.js";
import {
  mockLogger,
  mockSpinner,
  mocktFn,
} from "../../../../../vitest.setup.js";
import { CONFIG_KEY_ALIASES } from "../../../../../src/commands/config/utils.js";

const { mockGetSettingsConfig, mockResolveKeys } = vi.hoisted(() => ({
  mockResolveKeys: vi.fn(),
  mockGetSettingsConfig: vi.fn(),
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: vi.fn(),
}));

vi.mock("#commands/config/utils.js", async (importOriginal) => {
  const originalModule = await importOriginal<Record<string, unknown>>();
  return {
    ...originalModule,
    resolveKeys: mockResolveKeys,
    getSettingsConfig: mockGetSettingsConfig,
  };
});

const mockConfig = {
  settings: {
    language: "fr",
    defaultPackageManager: "npm",
    cacheStrategy: "daily",
    emptyKey: undefined,
  },
  templates: {},
};

describe("handleGetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockResolveKeys.mockImplementation((keys: string[]) => {
      return keys.map((key) =>
        CONFIG_KEY_ALIASES[key] ? CONFIG_KEY_ALIASES[key] : key,
      ) as (keyof typeof mockConfig.settings)[];
    });

    mockGetSettingsConfig.mockResolvedValue(mockConfig);
  });

  it("should retrieve and log a single key using its full name", async () => {
    await handleGetAction(["language"], false, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledWith("language: fr");
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
  });

  it("should retrieve and log a single key using its short alias", async () => {
    await handleGetAction(["lang"], false, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledWith("lang: fr");
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
  });

  it("should retrieve and log multiple mixed keys (alias and full)", async () => {
    await handleGetAction(["pm", "language"], true, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledTimes(2);
    expect(mockLogger.log).toHaveBeenCalledWith("pm: npm");
    expect(mockLogger.log).toHaveBeenCalledWith("language: fr");
  });

  it("should log an error for a non-existent key", async () => {
    await handleGetAction(["nonexistent"], false, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        mocktFn("errors.config.get_key_not_found", { key: "nonexistent" }),
      ),
    );
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
  });

  it("should handle multiple keys with some existing and some not", async () => {
    await handleGetAction(["language", "nonexistent", "pm"], true, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledTimes(3);
    expect(mockLogger.log).toHaveBeenCalledWith("language: fr");
    expect(mockLogger.log).toHaveBeenCalledWith("pm: npm");
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        mocktFn("errors.config.get_key_not_found", { key: "nonexistent" }),
      ),
    );
  });

  it("should correctly handle an existing key with an 'undefined' value", async () => {
    await handleGetAction(["emptyKey"], true, mockSpinner);

    expect(mockLogger.log).toHaveBeenCalledWith("emptyKey: undefined");
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
  });
});
