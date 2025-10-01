import { describe, it, expect } from "vitest";
import {
  validateCacheStrategy,
  validateDisplayMode,
  validateLanguage,
  validatePackageManager,
  validateProgrammingLanguage,
} from "../../../../src/utils/validations/config.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";
import {
  DisplayModes,
  PackageManagers,
  ProgrammingLanguage,
  TextLanguages,
  VALID_CACHE_STRATEGIES,
} from "../../../../src/utils/schema/schema.js";

const NEW_ERROR_KEY = "errors.validation.invalid_value";

describe("validatePackageManager", () => {
  it("should not throw an error for a valid package manager", () => {
    const validPm = PackageManagers.Npm;
    expect(() => validatePackageManager(validPm)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid package manager", () => {
    const invalidPm = "invalid-pm";
    expect(() => validatePackageManager(invalidPm)).toThrow(DevkitError);
    expect(() => validatePackageManager(invalidPm)).toThrow(
      mocktFn(NEW_ERROR_KEY, {
        key: "defaultPackageManager",
        options: Object.values(PackageManagers).join(", "),
      }),
    );
  });
});

describe("validateCacheStrategy", () => {
  it("should not throw an error for a valid cache strategy", () => {
    const validStrategy = VALID_CACHE_STRATEGIES[0];
    expect(() => validateCacheStrategy(validStrategy)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid cache strategy", () => {
    const invalidStrategy = "invalid-strategy";
    expect(() => validateCacheStrategy(invalidStrategy)).toThrow(DevkitError);
    expect(() => validateCacheStrategy(invalidStrategy)).toThrow(
      mocktFn(NEW_ERROR_KEY, {
        key: "cacheStrategy",
        options: VALID_CACHE_STRATEGIES.join(", "),
      }),
    );
  });
});

describe("validateLanguage", () => {
  it("should not throw an error for a valid text language", () => {
    const validLang = TextLanguages.English;
    expect(() => validateLanguage(validLang)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid text language", () => {
    const invalidLang = "invalid-lang";
    expect(() => validateLanguage(invalidLang)).toThrow(DevkitError);
    expect(() => validateLanguage(invalidLang)).toThrow(
      mocktFn(NEW_ERROR_KEY, {
        key: "language",
        options: Object.values(TextLanguages).join(", "),
      }),
    );
  });
});

describe("validateProgrammingLanguage", () => {
  it("should not throw an error for a valid programming language", () => {
    const validLang = ProgrammingLanguage.Javascript.toLowerCase();
    expect(() => validateProgrammingLanguage(validLang)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid programming language", () => {
    const invalidLang = "invalid-prog-lang";
    expect(() => validateProgrammingLanguage(invalidLang)).toThrow(DevkitError);
    expect(() => validateProgrammingLanguage(invalidLang)).toThrow(
      mocktFn(NEW_ERROR_KEY, {
        key: "Programming Language",
        options: Object.values(ProgrammingLanguage)
          .map((value) => value.toLowerCase())
          .join(", "),
      }),
    );
  });
});

describe("validateDisplayMode", () => {
  it("should not throw an error for a valid display mode", () => {
    const validLang = DisplayModes.Tree.toLowerCase();
    expect(() => validateDisplayMode(validLang)).not.toThrow();

    const validLang1 = DisplayModes.Table.toLowerCase();
    expect(() => validateDisplayMode(validLang1)).not.toThrow();
  });

  it("should throw a DevkitError for an invalid programming language", () => {
    const invalidDisplayMode = "invalid-display-mode";
    expect(() => validateDisplayMode(invalidDisplayMode)).toThrow(DevkitError);
    expect(() => validateDisplayMode(invalidDisplayMode)).toThrow(
      mocktFn(NEW_ERROR_KEY, {
        key: "mode",
        options: Object.values(DisplayModes)
          .map((value) => value.toLowerCase())
          .join(", "),
      }),
    );
  });
});
