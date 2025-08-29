import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  loadTranslations,
  translations,
} from "../../../../src/utils/internationalization/translation-loader.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import path from "path";

const { mockFs, mockOsLocale, mockFindLocalesDir } = vi.hoisted(() => ({
  mockFs: {
    readJson: vi.fn(),
  },
  mockOsLocale: vi.fn(),
  mockFindLocalesDir: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: mockFs,
}));

vi.mock("os-locale", () => ({
  osLocale: mockOsLocale,
}));

vi.mock("#utils/files/locales.js", () => ({
  findLocalesDir: mockFindLocalesDir,
}));

describe("loadTranslations", () => {
  const mockLocalesDir = "/mock/locales";
  const mockEnJsonPath = path.join(mockLocalesDir, "en.json");
  const mockFrJsonPath = path.join(mockLocalesDir, "fr.json");

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindLocalesDir.mockResolvedValue(mockLocalesDir);
  });

  it("should load translations based on user config language", async () => {
    mockOsLocale.mockResolvedValue("en_US");
    mockFs.readJson.mockImplementation(async (filePath) => {
      if (filePath === mockFrJsonPath) {
        return { "test.key": "Bonjour" };
      }
      return {};
    });

    await loadTranslations("fr");

    expect(mockFs.readJson).toHaveBeenCalledWith(mockFrJsonPath, {
      encoding: "utf-8",
    });
    expect(translations).toEqual({ "test.key": "Bonjour" });
  });

  it("should load translations based on system locale if no config language is provided", async () => {
    mockOsLocale.mockResolvedValue("fr-FR");
    mockFs.readJson.mockImplementation(async (filePath) => {
      if (filePath === mockFrJsonPath) {
        return { "test.key": "Bonjour" };
      }
      return {};
    });

    await loadTranslations(null);

    expect(mockFs.readJson).toHaveBeenCalledWith(mockFrJsonPath, {
      encoding: "utf-8",
    });
    expect(translations).toEqual({ "test.key": "Bonjour" });
  });

  it("should fall back to 'en' if the system locale is not supported", async () => {
    mockOsLocale.mockResolvedValue("es-ES"); // Unsupported locale
    mockFs.readJson.mockImplementation(async (filePath) => {
      if (filePath === mockEnJsonPath) {
        return { "test.key": "Hello" };
      }
      return {};
    });

    await loadTranslations(null);

    expect(mockFs.readJson).toHaveBeenCalledWith(mockEnJsonPath, {
      encoding: "utf-8",
    });
    expect(translations).toEqual({ "test.key": "Hello" });
  });

  it("should use 'en' as the default if no language is provided or supported", async () => {
    mockOsLocale.mockResolvedValue("en_US");
    mockFs.readJson.mockImplementation(async (filePath) => {
      if (filePath === mockEnJsonPath) {
        return { "test.key": "Hello" };
      }
      return {};
    });

    await loadTranslations(null);

    expect(mockFs.readJson).toHaveBeenCalledWith(mockEnJsonPath, {
      encoding: "utf-8",
    });
    expect(translations).toEqual({ "test.key": "Hello" });
  });

  it("should fall back to 'en.json' if the specified language file is not found", async () => {
    mockOsLocale.mockResolvedValue("fr-FR");
    mockFs.readJson.mockImplementation(async (filePath) => {
      if (filePath === mockFrJsonPath) {
        throw new Error("File not found");
      }
      if (filePath === mockEnJsonPath) {
        return { "test.key": "Hello" };
      }
      return {};
    });

    await loadTranslations("fr");

    expect(mockFs.readJson).toHaveBeenCalledWith(mockFrJsonPath, {
      encoding: "utf-8",
    });
    expect(mockFs.readJson).toHaveBeenCalledWith(mockEnJsonPath, {
      encoding: "utf-8",
    });
    expect(translations).toEqual({ "test.key": "Hello" });
  });

  it("should throw a DevkitError if both the target and fallback files fail to load", async () => {
    mockOsLocale.mockResolvedValue("fr-FR");
    mockFs.readJson.mockRejectedValue(new Error("File not found"));

    await expect(loadTranslations("fr")).rejects.toThrow(DevkitError);
    await expect(loadTranslations("fr")).rejects.toThrow(
      /Failed to load translations/,
    );
  });
});
