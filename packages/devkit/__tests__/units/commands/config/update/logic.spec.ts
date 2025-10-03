import { vi, describe, it, expect, beforeEach } from "vitest";
import { resolveTemplateNamesForUpdate } from "../../../../../src/commands/config/update/logic.js";
import type { CliConfig } from "../../../../../src/utils/schema/schema.js";

const { mockReadConfigSources } = vi.hoisted(() => ({
  mockReadConfigSources: vi.fn(),
}));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

const mockCliConfig: CliConfig = {
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
      templates: {
        "py-data": {
          description: "Python data script",
          location: "https://github.com/python/data",
        },
      },
    },
    empty: {
      templates: {},
    },
  },
};

const createMockSources = (
  targetType: "local" | "global" | "none",
  config: CliConfig | null = mockCliConfig,
) => {
  return Promise.resolve({
    local: targetType === "local" ? structuredClone(config) : null,
    global: targetType === "global" ? structuredClone(config) : null,
    default: structuredClone(mockCliConfig),
    configFound: targetType !== "none",
  });
};

describe("resolveTemplateNamesForUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Template Resolution (Local Config)", () => {
    beforeEach(() => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
    });

    it("should resolve a single template name correctly", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["react-ts"],
        false,
      );
      expect(result.resolvedNames).toEqual(["react-ts"]);
      expect(result.notFoundNames).toEqual([]);
    });

    it("should resolve a template by its alias", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["rt"],
        false,
      );
      expect(result.resolvedNames).toEqual(["react-ts"]);
      expect(result.notFoundNames).toEqual([]);
    });

    it("should resolve multiple unique templates from mixed names/aliases", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["vue-basic", "rt", "react-ts"],
        false,
      );
      expect(result.resolvedNames).toEqual(["vue-basic", "react-ts"]);
      expect(result.notFoundNames).toEqual([]);
    });

    it("should correctly identify not found templates", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["react-ts", "missing-one", "vb", "missing-two"],
        false,
      );
      expect(result.resolvedNames).toEqual(["react-ts", "vue-basic"]);
      expect(result.notFoundNames).toEqual(["missing-one", "missing-two"]);
    });

    it("should return empty arrays for resolution if all names are not found", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["missing-one", "missing-two"],
        false,
      );
      expect(result.resolvedNames).toEqual([]);
      expect(result.notFoundNames).toEqual(["missing-one", "missing-two"]);
    });
  });

  describe("Wildcard ('*') Resolution", () => {
    beforeEach(() => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("global"),
      );
    });

    it("should resolve ALL templates for the language when '*' is used alone", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["*"],
        true,
      );
      expect(result.resolvedNames.sort()).toEqual(
        ["react-ts", "vue-basic"].sort(),
      );
      expect(result.notFoundNames).toEqual([]);
    });

    it("should resolve ALL templates and list non-wildcard names as notFound if they don't resolve", async () => {
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["*", "missing-A", "rt", "missing-B"],
        true,
      );
      expect(result.resolvedNames.sort()).toEqual(
        ["react-ts", "vue-basic"].sort(),
      );
      expect(result.notFoundNames.sort()).toEqual(
        ["missing-A", "missing-B", "rt"].sort(),
      );
    });

    it("should resolve ALL templates for a language with one template", async () => {
      const result = await resolveTemplateNamesForUpdate("python", ["*"], true);
      expect(result.resolvedNames).toEqual(["py-data"]);
      expect(result.notFoundNames).toEqual([]);
    });
  });

  describe("Config State Handling", () => {
    it("should use global config when isGlobal is true", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("global"),
      );
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["react-ts"],
        true,
      );
      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: true,
        forceLocal: false,
      });
      expect(result.resolvedNames).toEqual(["react-ts"]);
    });

    it("should use local config when isGlobal is false", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["vue-basic"],
        false,
      );
      expect(mockReadConfigSources).toHaveBeenCalledWith({
        forceGlobal: false,
        forceLocal: true,
      });
      expect(result.resolvedNames).toEqual(["vue-basic"]);
    });

    it("should treat missing local config file as 'language templates undefined'", async () => {
      mockReadConfigSources.mockResolvedValue({
        local: null,
        global: mockCliConfig,
        default: mockCliConfig,
        configFound: true,
      });

      const result = await resolveTemplateNamesForUpdate(
        "javascript",
        ["react-ts"],
        false,
      );

      expect(result.resolvedNames).toEqual([]);
      expect(result.notFoundNames).toEqual(["react-ts"]);
    });

    it("should return names as notFound if language exists but has empty templates map", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      const result = await resolveTemplateNamesForUpdate(
        "empty",
        ["new-temp"],
        false,
      );
      expect(result.resolvedNames).toEqual([]);
      expect(result.notFoundNames).toEqual(["new-temp"]);
    });

    it("should return names as notFound if language does not exist in the config", async () => {
      mockReadConfigSources.mockImplementation(() =>
        createMockSources("local"),
      );
      const result = await resolveTemplateNamesForUpdate(
        "rust",
        ["hello-world"],
        false,
      );
      expect(result.resolvedNames).toEqual([]);
      expect(result.notFoundNames).toEqual(["hello-world"]);
    });
  });
});
