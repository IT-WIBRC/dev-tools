import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateConfigValue,
  configAliases,
} from "../../../../src/commands/config/validate-config.js";
import {
  PackageManagers,
  VALID_CACHE_STRATEGIES,
  TextLanguages,
} from "#utils/configs/schema.js";
import { DevkitError } from "#utils/errors/base.js";

describe("validate-config.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateConfigValue", () => {
    it("should not throw an error for a valid package manager", () => {
      expect(() =>
        validateConfigValue("defaultPackageManager", PackageManagers.Npm),
      ).not.toThrow();
    });

    it("should throw an error for an invalid package manager", () => {
      expect(() =>
        validateConfigValue("defaultPackageManager", "invalid-pm"),
      ).toThrow(DevkitError);
      expect(() =>
        validateConfigValue("defaultPackageManager", "invalid-pm"),
      ).toThrow(
        `error.invalid.value- options key:defaultPackageManager, options:${Object.values(PackageManagers).join(", ")}`,
      );
    });

    it("should not throw an error for a valid cache strategy", () => {
      expect(() =>
        validateConfigValue("cacheStrategy", "always-refresh"),
      ).not.toThrow();
    });

    it("should throw an error for an invalid cache strategy", () => {
      expect(() =>
        validateConfigValue("cacheStrategy", "invalid-cache"),
      ).toThrow(DevkitError);
      expect(() =>
        validateConfigValue("cacheStrategy", "invalid-cache"),
      ).toThrow(
        `error.invalid.value- options key:cacheStrategy, options:${VALID_CACHE_STRATEGIES.join(", ")}`,
      );
    });

    it("should not throw an error for a valid language", () => {
      expect(() =>
        validateConfigValue("language", TextLanguages.English),
      ).not.toThrow();
    });

    it("should throw an error for an invalid language", () => {
      expect(() => validateConfigValue("language", "français")).toThrow(
        DevkitError,
      );
      expect(() => validateConfigValue("language", "français")).toThrow(
        `error.invalid.value- options key:language, options:${Object.values(TextLanguages).join(", ")}`,
      );
    });

    it("should not throw an error for an unknown key", () => {
      expect(() =>
        validateConfigValue("unknownKey", "some-value"),
      ).not.toThrow();
    });
  });

  describe("configAliases", () => {
    it("should have correct mappings for package manager aliases", () => {
      expect(configAliases.pm).toBe("defaultPackageManager");
      expect(configAliases.packageManager).toBe("defaultPackageManager");
    });

    it("should have correct mappings for cache strategy aliases", () => {
      expect(configAliases.cache).toBe("cacheStrategy");
      expect(configAliases.cacheStrategy).toBe("cacheStrategy");
    });

    it("should have correct mappings for language aliases", () => {
      expect(configAliases.language).toBe("language");
      expect(configAliases.lg).toBe("language");
    });
  });
});
