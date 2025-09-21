import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  PackageManagers,
  ProgrammingLanguage,
  VALID_CACHE_STRATEGIES,
  type CliConfig,
} from "../../../integrations/common.js";
import { validateAndSaveTemplate } from "../../../../src/commands/config/validate-and-save.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";
import type { AddTemplateSchema } from "../../../../src/commands/config/types.js";

const {
  mockSaveCliConfig,
  mockValidateLocation,
  mockValidateAlias,
  mockValidateDescription,
  mockValidatePackageManager,
  mockValidateCacheStrategy,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockSaveCliConfig: vi.fn(),
  mockValidateLocation: vi.fn(),
  mockValidateAlias: vi.fn(),
  mockValidateDescription: vi.fn(),
  mockValidatePackageManager: vi.fn(),
  mockValidateCacheStrategy: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

vi.mock("#utils/configs/writer.js", () => ({
  saveCliConfig: mockSaveCliConfig,
}));

vi.mock("#utils/validations/templates.js", () => ({
  validateLocation: mockValidateLocation,
  validateAlias: mockValidateAlias,
  validateDescription: mockValidateDescription,
}));

vi.mock("#utils/validations/config.js", () => ({
  validatePackageManager: mockValidatePackageManager,
  validateCacheStrategy: mockValidateCacheStrategy,
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

const jsLang = ProgrammingLanguage.Javascript.toLowerCase();

const mockConfig: CliConfig = {
  templates: {
    [jsLang]: {
      templates: {
        "existing-template": {
          description: "An existing template",
          location: "http://example.com/existing",
          alias: "ext",
        },
      },
    },
  },
} as unknown as CliConfig;

const mockTemplateDetails: AddTemplateSchema = {
  language: jsLang,
  templateName: "new-template",
  description: "A new template for testing",
  location: "http://example.com/new-template.git",
  alias: "nt",
  cacheStrategy: "daily",
  packageManager: "npm",
};

describe("validateAndSaveTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateLocation.mockResolvedValue(undefined);
    mockValidateAlias.mockResolvedValue(undefined);
    mockValidateDescription.mockResolvedValue(undefined);
    mockValidatePackageManager.mockResolvedValue(undefined);
    mockValidateCacheStrategy.mockResolvedValue(undefined);
    mockValidateProgrammingLanguage.mockResolvedValue(undefined);
  });

  it("should successfully validate and save a new template", async () => {
    const newConfig = structuredClone(mockConfig);
    await validateAndSaveTemplate(
      mockTemplateDetails,
      newConfig,
      false,
      mockSpinner,
    );

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
      mockTemplateDetails.language,
    );
    expect(mockValidateLocation).toHaveBeenCalledWith(
      mockTemplateDetails.location,
      mockSpinner,
    );
    expect(mockValidateDescription).toHaveBeenCalledWith(
      mockTemplateDetails.description,
    );
    expect(mockValidateAlias).toHaveBeenCalledWith(mockTemplateDetails.alias);
    expect(mockValidatePackageManager).toHaveBeenCalledWith(
      mockTemplateDetails.packageManager,
    );
    expect(mockValidateCacheStrategy).toHaveBeenCalledWith(
      mockTemplateDetails.cacheStrategy,
    );

    const expectedConfig = {
      ...mockConfig,
      templates: {
        [jsLang]: {
          templates: {
            "existing-template": {
              description: "An existing template",
              location: "http://example.com/existing",
              alias: "ext",
            },
            "new-template": {
              description: "A new template for testing",
              location: "http://example.com/new-template.git",
              alias: "nt",
              cacheStrategy: "daily",
              packageManager: "npm",
            },
          },
        },
      },
    };

    expect(mockSaveCliConfig).toHaveBeenCalledWith(expectedConfig, false);
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it("should handle invalid programming language", async () => {
    const error = new DevkitError("Invalid programming language");
    const mockTemplateDetailsWithWrongLanguage = {
      ...mockTemplateDetails,
      language: "python",
    };
    mockValidateProgrammingLanguage.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(
        mockTemplateDetailsWithWrongLanguage,
        mockConfig,
        false,
        mockSpinner,
      ),
    ).rejects.toThrowError(error);

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
      mockTemplateDetailsWithWrongLanguage.language,
    );
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle invalid template location", async () => {
    const error = new DevkitError("Invalid location");
    mockValidateLocation.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(
        mockTemplateDetails,
        mockConfig,
        false,
        mockSpinner,
      ),
    ).rejects.toThrowError(error);

    expect(mockValidateLocation).toHaveBeenCalled();
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle invalid description", async () => {
    const error = new DevkitError("Description is too short");
    mockValidateDescription.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(
        mockTemplateDetails,
        mockConfig,
        false,
        mockSpinner,
      ),
    ).rejects.toThrowError(error);

    expect(mockValidateDescription).toHaveBeenCalled();
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle invalid alias", async () => {
    const error = new DevkitError("Alias is too short");
    mockValidateAlias.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(
        mockTemplateDetails,
        mockConfig,
        false,
        mockSpinner,
      ),
    ).rejects.toThrowError(error);

    expect(mockValidateAlias).toHaveBeenCalled();
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle duplicate template name", async () => {
    const duplicateDetails = {
      ...mockTemplateDetails,
      templateName: "existing-template",
      alias: "othr",
    };

    await expect(
      validateAndSaveTemplate(duplicateDetails, mockConfig, false, mockSpinner),
    ).rejects.toThrowError(
      new DevkitError(
        mocktFn("error.template.exists", {
          template: duplicateDetails.templateName,
        }),
      ),
    );

    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle duplicate alias", async () => {
    const duplicateDetails = { ...mockTemplateDetails, alias: "ext" };

    await expect(
      validateAndSaveTemplate(duplicateDetails, mockConfig, false, mockSpinner),
    ).rejects.toThrowError(
      new DevkitError(
        mocktFn("error.alias.exists", { alias: duplicateDetails.alias }),
      ),
    );

    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle invalid cache strategy", async () => {
    const invalidDetails = {
      ...mockTemplateDetails,
      cacheStrategy: "invalid-cache",
    };
    const error = new DevkitError(
      mocktFn("error.invalid.cache_strategy", {
        value: "invalid-cache",
        options: VALID_CACHE_STRATEGIES.join(", "),
      }),
    );
    mockValidateCacheStrategy.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(invalidDetails, mockConfig, false, mockSpinner),
    ).rejects.toThrowError(error);

    expect(mockValidateCacheStrategy).toHaveBeenCalledWith("invalid-cache");
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should handle invalid package manager", async () => {
    const invalidDetails = {
      ...mockTemplateDetails,
      packageManager: "invalid-pm",
    };
    const error = new DevkitError(
      mocktFn("error.invalid.package_manager", {
        value: "invalid-pm",
        options: Object.values(PackageManagers).join(", "),
      }),
    );
    mockValidatePackageManager.mockImplementationOnce(() => {
      throw error;
    });

    await expect(
      validateAndSaveTemplate(invalidDetails, mockConfig, false, mockSpinner),
    ).rejects.toThrowError(error);

    expect(mockValidatePackageManager).toHaveBeenCalledWith("invalid-pm");
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });
});
