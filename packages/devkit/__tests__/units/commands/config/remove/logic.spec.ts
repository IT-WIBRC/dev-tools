import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  saveConfig,
  getTargetConfigForModification,
  resolveTemplateNames,
  getTemplateNamesToActOn,
} from "../../../../../src/commands/config/remove/logic.js";
import { mocktFn } from "../../../../../vitest.setup.js";
import type { CliConfig } from "../../../../integrations/common.js";
import { DevkitError } from "../../../../../src/utils/errors/base.js";

const {
  mockReadConfigSources,
  mockSaveGlobalConfig,
  mockSaveLocalConfig,
  mockValidateProgrammingLanguage,
} = vi.hoisted(() => ({
  mockReadConfigSources: vi.fn(),
  mockSaveGlobalConfig: vi.fn(),
  mockSaveLocalConfig: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

vi.mock("#core/config/writer.js", () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
  saveLocalConfig: mockSaveLocalConfig,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

const BASE_CONFIG: CliConfig = {
  settings: {} as CliConfig["settings"],
  templates: {
    javascript: {
      templates: {
        "react-ts": {
          description: "A React project with TypeScript",
          location: "https://github.com/react-ts-template",
          alias: "rt",
        },
        "vue-basic": {
          description: "A basic Vue template",
          location: "https://github.com/vuejs/vue",
          alias: "vb",
        },
      },
    },
    python: {
      templates: {},
    },
  },
};

const ERROR_LOCAL_NOT_FOUND_KEY = "errors.config.local_not_found";
const ERROR_GLOBAL_NOT_FOUND_KEY = "errors.config.global_not_found";
const ERROR_LANG_NOT_FOUND_KEY = "errors.template.language_not_found";

const createMockSources = (
  local: CliConfig | null,
  global: CliConfig | null,
) => {
  return Promise.resolve({
    local: structuredClone(local),
    global: structuredClone(global),
    default: structuredClone(BASE_CONFIG),
    configFound: local !== null || global !== null,
  });
};

describe("Remove Command Logic Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateProgrammingLanguage.mockReturnValue(true);
  });

  describe("saveConfig", () => {
    it("should call saveLocalConfig when isGlobal is false", async () => {
      const config = structuredClone(BASE_CONFIG);
      await saveConfig(config, false);

      expect(mockSaveLocalConfig).toHaveBeenCalledWith(config);
      expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
    });

    it("should call saveGlobalConfig when isGlobal is true", async () => {
      const config = structuredClone(BASE_CONFIG);
      await saveConfig(config, true);

      expect(mockSaveGlobalConfig).toHaveBeenCalledWith(config);
      expect(mockSaveLocalConfig).not.toHaveBeenCalled();
    });
  });

  describe("getTargetConfigForModification", () => {
    it("should return local config when isGlobal is false and local exists", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources(BASE_CONFIG, null),
      );

      const config = await getTargetConfigForModification(false);
      expect(config.templates.javascript).toBeDefined();
    });

    it("should return global config when isGlobal is true and global exists", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources(null, BASE_CONFIG),
      );

      const config = await getTargetConfigForModification(true);
      expect(config.templates.javascript).toBeDefined();
    });

    it("should throw DevkitError for missing local config", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources(null, BASE_CONFIG),
      );

      await expect(getTargetConfigForModification(false)).rejects.toThrow(
        new DevkitError(mocktFn(ERROR_LOCAL_NOT_FOUND_KEY)),
      );
    });

    it("should throw DevkitError for missing global config", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources(BASE_CONFIG, null),
      );

      await expect(getTargetConfigForModification(true)).rejects.toThrow(
        new DevkitError(mocktFn(ERROR_GLOBAL_NOT_FOUND_KEY)),
      );
    });
  });

  describe("resolveTemplateNames", () => {
    const templatesMap = {
      "react-ts": "react-ts",
      rt: "react-ts",
      "vue-basic": "vue-basic",
      vb: "vue-basic",
    };

    it("should resolve single template name", () => {
      const result = resolveTemplateNames(["vue-basic"], templatesMap);
      expect(result.templatesToActOn).toEqual(["vue-basic"]);
      expect(result.notFound).toEqual([]);
    });

    it("should resolve single template alias", () => {
      const result = resolveTemplateNames(["rt"], templatesMap);
      expect(result.templatesToActOn).toEqual(["react-ts"]);
      expect(result.notFound).toEqual([]);
    });

    it("should resolve multiple unique names from mixed names and aliases", () => {
      const result = resolveTemplateNames(
        ["vue-basic", "rt", "react-ts"],
        templatesMap,
      );
      expect(result.templatesToActOn).toEqual(["vue-basic", "react-ts"]);
      expect(result.notFound).toEqual([]);
    });

    it("should identify not found names correctly", () => {
      const result = resolveTemplateNames(
        ["vue-basic", "not-found", "rt", "another-one"],
        templatesMap,
      );
      expect(result.templatesToActOn).toEqual(["vue-basic", "react-ts"]);
      expect(result.notFound).toEqual(["not-found", "another-one"]);
    });

    it("should handle wildcard '*' alone and resolve all templates", () => {
      const result = resolveTemplateNames(["*"], templatesMap);
      expect(result.templatesToActOn.sort()).toEqual(
        ["react-ts", "vue-basic"].sort(),
      );
      expect(result.notFound).toEqual([]);
    });

    it("should handle wildcard '*' with other names/aliases and only list not-found explicit names", () => {
      const result = resolveTemplateNames(
        ["*", "rt", "missing-A", "vb", "missing-B"],
        templatesMap,
      );
      expect(result.templatesToActOn.sort()).toEqual(
        ["react-ts", "vue-basic"].sort(),
      );
      expect(result.notFound.sort()).toEqual(
        ["missing-A", "missing-B", "rt", "vb"].sort(),
      );
    });

    it("should return empty results if templatesMap is empty", () => {
      const result = resolveTemplateNames(["template-1"], {});
      expect(result.templatesToActOn).toEqual([]);
      expect(result.notFound).toEqual(["template-1"]);
    });
  });

  describe("getTemplateNamesToActOn", () => {
    beforeEach(() => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources(BASE_CONFIG, null),
      );
    });

    it("should throw error if validateProgrammingLanguage fails", async () => {
      const mockError = new DevkitError("Invalid language");
      mockValidateProgrammingLanguage.mockImplementation(() => {
        throw mockError;
      });

      await expect(
        getTemplateNamesToActOn("invalid-lang", ["template"], false),
      ).rejects.toThrow(mockError);

      expect(mockReadConfigSources).not.toHaveBeenCalled();
    });

    it("should return correct structure for valid template name", async () => {
      const result = await getTemplateNamesToActOn(
        "javascript",
        ["react-ts"],
        false,
      );

      expect(result.targetConfig).toEqual(BASE_CONFIG);
      expect(result.languageTemplates).toEqual(
        BASE_CONFIG.templates?.javascript?.templates,
      );
      expect(result.templatesToActOn).toEqual(["react-ts"]);
      expect(result.notFound).toEqual([]);
    });

    it("should throw error if language is not found in config", async () => {
      await expect(
        getTemplateNamesToActOn("csharp", ["my-template"], false),
      ).rejects.toThrow(
        new DevkitError(
          mocktFn(ERROR_LANG_NOT_FOUND_KEY, { language: "csharp" }),
        ),
      );
    });

    it("should throw error if language is found but has empty templates map", async () => {
      const result = await getTemplateNamesToActOn(
        "python",
        ["py-basic"],
        false,
      );

      expect(result.templatesToActOn).toEqual([]);
      expect(result.notFound).toEqual(["py-basic"]);
    });
  });
});
