import { vi, describe, it, expect, beforeEach } from "vitest";
import { validateConfig } from "../../../../src/core/config/validation.js";
import { ConfigError, DevkitError } from "../../../../src/utils/errors/base.js";
import { mocktFn } from "../../../../vitest.setup.js";

const {
  mockValidatePackageManager,
  mockValidateCacheStrategy,
  mockValidateLanguage,
  mockValidateProgrammingLanguage,
  mockValidateDescription,
} = vi.hoisted(() => ({
  mockValidatePackageManager: vi.fn(),
  mockValidateCacheStrategy: vi.fn(),
  mockValidateLanguage: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
  mockValidateDescription: vi.fn(),
}));

vi.mock("#utils/validations/config.js", () => ({
  validatePackageManager: mockValidatePackageManager,
  validateCacheStrategy: mockValidateCacheStrategy,
  validateLanguage: mockValidateLanguage,
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("#utils/validations/templates.js", () => ({
  validateDescription: mockValidateDescription,
}));

const VALID_CONFIG = {
  templates: {
    javascript: {
      templates: {
        vue: {
          location: "file://./vue",
          description: "A Vue project.",
          alias: "v",
          packageManager: "npm",
          cacheStrategy: "daily",
        },
      },
    },
    typescript: {
      templates: {
        node: {
          location: "file://./node",
          description: "A Node project.",
        },
      },
    },
  },
  settings: {
    defaultPackageManager: "npm",
    cacheStrategy: "daily",
    language: "en",
  },
};

const ERROR_KEYS = {
  MALFORMED_ROOT: "errors.config.malformed_root",
  VALIDATION_FAILED: "errors.config.validation_failed",
  MISSING_FIELD: "errors.config.missing_or_malformed",
  SETTING_INVALID: "errors.config.setting_invalid",
  INVALID_LANG_KEY: "errors.config.invalid_language_key",
  TEMPLATE_STRUCTURE: "errors.config.template_structure_malformed",
  TEMPLATE_MALFORMED: "errors.config.template_malformed",
  TEMPLATE_FIELD_MISSING: "errors.config.template_field_missing",
  TEMPLATE_FIELD_INVALID: "errors.config.template_field_invalid",
};

describe("validateConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidatePackageManager.mockImplementation(() => {});
    mockValidateCacheStrategy.mockImplementation(() => {});
    mockValidateLanguage.mockImplementation(() => {});
    mockValidateProgrammingLanguage.mockImplementation(() => {});
    mockValidateDescription.mockImplementation(() => {});
  });

  it("should succeed for a valid configuration object", async () => {
    const result = await validateConfig(VALID_CONFIG);

    expect(result).toEqual(VALID_CONFIG);

    expect(mockValidatePackageManager).toHaveBeenCalledTimes(2);
    expect(mockValidateCacheStrategy).toHaveBeenCalledTimes(2);
    expect(mockValidateLanguage).toHaveBeenCalledTimes(1);
    expect(mockValidateProgrammingLanguage).toHaveBeenCalledTimes(2);
    expect(mockValidateDescription).toHaveBeenCalledTimes(2);
  });

  it("should throw ConfigError if config is null or a primitive", async () => {
    await expect(validateConfig(null)).rejects.toThrow(ConfigError);
    await expect(validateConfig(null)).rejects.toThrow(
      mocktFn(ERROR_KEYS.MALFORMED_ROOT),
    );

    await expect(validateConfig("not an object")).rejects.toThrow(ConfigError);
    await expect(validateConfig(123)).rejects.toThrow(ConfigError);
  });

  it("should fail if 'settings' block is missing or malformed", async () => {
    const invalidConfig = { ...VALID_CONFIG, settings: null };
    delete (invalidConfig as any).settings;

    await expect(
      validateConfig({ ...VALID_CONFIG, settings: undefined }),
    ).rejects.toThrow(ConfigError);

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.MISSING_FIELD, {
          field: "settings",
        })}`,
      }),
    );
  });

  it("should fail if 'templates' block is missing or malformed", async () => {
    const invalidConfig = { ...VALID_CONFIG, templates: 123 };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.MISSING_FIELD, {
          field: "templates",
        })}`,
      }),
    );
  });

  it("should fail if defaultPackageManager is invalid or missing", async () => {
    mockValidatePackageManager.mockImplementationOnce(() => {
      throw new DevkitError("Invalid PM");
    });

    const invalidConfig = {
      ...VALID_CONFIG,
      settings: { ...VALID_CONFIG.settings, defaultPackageManager: "invalid" },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.SETTING_INVALID, { setting: "defaultPackageManager" })}`,
      }),
    );

    const missingConfig = {
      ...VALID_CONFIG,
      settings: { ...VALID_CONFIG.settings, defaultPackageManager: null },
    };
    await expect(validateConfig(missingConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.SETTING_INVALID, { setting: "defaultPackageManager" })}`,
      }),
    );
  });

  it("should fail if language is invalid", async () => {
    mockValidateLanguage.mockImplementationOnce(() => {
      throw new DevkitError("Invalid Lang");
    });

    const invalidConfig = {
      ...VALID_CONFIG,
      settings: { ...VALID_CONFIG.settings, language: "invalid" },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.SETTING_INVALID, { setting: "language" })}`,
      }),
    );
  });

  it("should fail if a template language key is invalid", async () => {
    mockValidateProgrammingLanguage.mockImplementationOnce(() => {
      throw new ConfigError("Invalid Lang Key");
    });

    const invalidConfig = {
      ...VALID_CONFIG,
      templates: {
        BAD_LANGUAGE: {
          templates: { t1: { location: "a", description: "b" } },
        },
        ...VALID_CONFIG.templates,
      },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.INVALID_LANG_KEY, { key: "BAD_LANGUAGE" })}`,
      }),
    );
  });

  it("should fail if a template language block lacks the 'templates' object", async () => {
    const invalidConfig = {
      ...VALID_CONFIG,
      templates: {
        javascript: { templates: "not an object" as any },
      },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.TEMPLATE_STRUCTURE, { language: "javascript" })}`,
      }),
    );
  });

  it("should fail if a template is missing the required 'location' field", async () => {
    const invalidConfig = {
      ...VALID_CONFIG,
      templates: {
        javascript: { templates: { vue: { description: "a", location: "" } } },
      },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.TEMPLATE_FIELD_MISSING, { language: "javascript", template: "vue", field: "location" })}`,
      }),
    );
  });

  it("should fail if a template has an invalid 'description' field", async () => {
    mockValidateDescription.mockImplementation(() => {
      throw new ConfigError("Description too short");
    });

    const invalidConfig = {
      ...VALID_CONFIG,
      templates: {
        javascript: {
          templates: { vue: { location: "a", description: "too short" } },
        },
      },
    };

    await expect(validateConfig(invalidConfig)).rejects.toThrow(
      mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
        details: `  - ${mocktFn(ERROR_KEYS.TEMPLATE_FIELD_MISSING, { language: "javascript", template: "vue", field: "description" })}`,
      }),
    );
  });

  it("should collect multiple template errors and throw one ConfigError", async () => {
    mockValidatePackageManager.mockImplementationOnce(() => {
      throw new DevkitError("Invalid PM");
    });

    const templates = {
      javascript: {
        templates: { vue: VALID_CONFIG.templates.javascript.templates.vue },
      },
      typescript: {
        templates: { node: { description: "a", location: "" } },
      },
    };

    const invalidConfig = { ...VALID_CONFIG, templates };

    await expect(validateConfig(invalidConfig)).rejects.toThrowError(
      new ConfigError(
        mocktFn(ERROR_KEYS.VALIDATION_FAILED, {
          details: `  - ${mocktFn(ERROR_KEYS.SETTING_INVALID, {
            setting: "defaultPackageManager",
          })}\n  - ${mocktFn(ERROR_KEYS.TEMPLATE_FIELD_MISSING, {
            language: "typescript",
            template: "node",
            field: "location",
          })}`,
        }),
      ),
    );
  });
});
