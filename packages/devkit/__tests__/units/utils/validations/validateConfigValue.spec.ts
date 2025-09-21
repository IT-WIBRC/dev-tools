import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  PackageManagers,
  VALID_CACHE_STRATEGIES,
} from "../../../integrations/common.js";
import { validateConfigValue } from "../../../../src/utils/validations/validateConfigValue.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";
import { configAliases } from "../../../../src/utils/validations/configAliases.js";

const {
  mockValidatePackageManager,
  mockValidateCacheStrategy,
  mockValidateLanguage,
} = vi.hoisted(() => ({
  mockValidatePackageManager: vi.fn(),
  mockValidateCacheStrategy: vi.fn(),
  mockValidateLanguage: vi.fn(),
}));

vi.mock("../../../../src/utils/validations/config.js", () => ({
  validatePackageManager: mockValidatePackageManager,
  validateCacheStrategy: mockValidateCacheStrategy,
  validateLanguage: mockValidateLanguage,
}));

describe("validateConfigValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not throw an error for a valid key and value", () => {
    const key = "pm";
    const value = PackageManagers.Npm;

    expect(() => validateConfigValue(key, value)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid key", () => {
    const invalidKey = "invalidKey";
    const value = "someValue";

    expect(() => validateConfigValue(invalidKey, value)).toThrow(DevkitError);
    expect(() => validateConfigValue(invalidKey, value)).toThrow(
      mocktFn("error.invalid.key", {
        key: invalidKey,
        keys: Object.keys(configAliases).join(", "),
      }),
    );
  });

  it("should call validatePackageManager for defaultPackageManager", () => {
    const key = "pm";
    const value = PackageManagers.Yarn;
    validateConfigValue(key, value);
    expect(mockValidatePackageManager).toHaveBeenCalledOnce();
    expect(mockValidatePackageManager).toHaveBeenCalledWith(value);
  });

  it("should call validateCacheStrategy for cacheStrategy", () => {
    const key = "cache";
    const value = VALID_CACHE_STRATEGIES[0];
    validateConfigValue(key, value);
    expect(mockValidateCacheStrategy).toHaveBeenCalledOnce();
    expect(mockValidateCacheStrategy).toHaveBeenCalledWith(value);
  });

  it("should call validateLanguage for language", () => {
    const key = "language";
    const value = "Spanish";
    validateConfigValue(key, value);
    expect(mockValidateLanguage).toHaveBeenCalledWith(value);
  });

  it("should not throw an error for a key with no specific validator", () => {
    const mockAliasesWithDummy = { ...configAliases, dummyKey: "dummy" };
    vi.mock("../../../src/utils/validations/configAliases.js", () => ({
      configAliases: mockAliasesWithDummy,
    }));
    const key = "dummyKey";
    const value = "someValue";
    expect(() => validateConfigValue(key, value)).not.toThrowError(
      new DevkitError(
        mocktFn("error.invalid.key", {
          key,
          keys: Object.keys(mockAliasesWithDummy).join(", "),
        }),
      ),
    );
  });
});
