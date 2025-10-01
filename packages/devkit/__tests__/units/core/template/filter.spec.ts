import { beforeEach, describe, expect, it, vi } from "vitest";
import { filterTemplatesByWhereClause } from "../../../../src/core/template/filter.js";
import type { LanguageConfig } from "../../../../src/utils/schema/schema.js";
import { mockLogger } from "../../../../vitest.setup.js";

const DELIMITER_MISSING_KEY = "warnings.filter_delimiter_missing";
const PROPERTY_UNRECOGNIZED_KEY = "warnings.filter_property_unrecognized";
const REGEX_INVALID_KEY = "errors.validation.template_name_required";

const sampleTemplates: LanguageConfig["templates"] = {
  "ts-express-api": {
    description: "Express API with TypeScript",
    alias: "api",
    packageManager: "npm",
    cacheStrategy: "always-refresh",
    location: "github:user/ts-api",
  },
  "js-frontend-app": {
    description: "Simple React App with JavaScript",
    alias: "react",
    packageManager: "yarn",
    location: "local:./templates/react-app",
  },
  "vue-component-lib": {
    description: "Component library for Vue",
    packageManager: "pnpm",
    cacheStrategy: "daily",
    location: "github:user/vue-lib",
  },
  "ts-node-cli": {
    description: "Node CLI with TypeScript and Bun",
    alias: "cli",
    packageManager: "bun",
    cacheStrategy: "never-refresh",
    location: "github:user/ts-cli",
  },
};

type TemplateEntry = [string, LanguageConfig["templates"][string]];
const allTemplateEntries: TemplateEntry[] = Object.entries(sampleTemplates);

describe("filterTemplatesByWhereClause", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all templates if whereClauses is empty or null/undefined", () => {
    expect(filterTemplatesByWhereClause(sampleTemplates, [])).toEqual(
      allTemplateEntries,
    );
    expect(filterTemplatesByWhereClause(sampleTemplates, [])).toEqual(
      allTemplateEntries,
    );
    expect(filterTemplatesByWhereClause(sampleTemplates, [])).toEqual(
      allTemplateEntries,
    );
  });

  describe("Property Matching (Substring, Case-Insensitive)", () => {
    it("should filter by packageManager using includes(), matching both npm and pnpm", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, ["pm:npm"]);
      expect(result).toHaveLength(2);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "vue-component-lib",
      ]);
    });

    it("should filter by alias using colon delimiter (alias:react)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "alias:rEaCt",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("js-frontend-app");
    });

    it("should return empty array when filtering by alias using equals delimiter for a template without alias", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "alias=vue",
      ]);
      expect(result).toHaveLength(0);
    });

    it("should filter by description substring (desc:react)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "desc:react",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("js-frontend-app");
    });

    it("should filter by location substring (loc:github)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "loc:github",
      ]);
      expect(result).toHaveLength(3);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "vue-component-lib",
        "ts-node-cli",
      ]);
    });

    it("should return empty array if no matches are found", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "name:nonexistent",
      ]);
      expect(result).toEqual([]);
    });
  });

  describe("Regex Matching (/.../)", () => {
    it("should filter using regex for START WITH (pm: /^npm/)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:/^npm$/",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("ts-express-api");
    });

    it("should filter using regex for END WITH (loc: /lib$/)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "loc:/lib$/",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("vue-component-lib");
    });

    it("should filter using complex regex pattern (name: /ts-(express|node)/)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "name:/Ts-(ExPreSs|nOdE)/",
      ]);
      expect(result).toHaveLength(2);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "ts-node-cli",
      ]);
    });

    it("should handle regex that matches part of the value (loc: /user/)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "loc:/user/",
      ]);
      expect(result).toHaveLength(3);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "vue-component-lib",
        "ts-node-cli",
      ]);
    });
  });

  describe("Logical AND (Multiple Clauses)", () => {
    it("should filter by multiple clauses (Regex AND Substring)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:/^npm$/",
        "name:express",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("ts-express-api");
    });

    it("should handle multiple clauses that result in no match", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "name:ts",
        "pm:yarn",
      ]);
      expect(result).toHaveLength(0);
    });

    it("should handle mixed delimiters (colon and equals)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "name:ts",
        "pm=npm",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("ts-express-api");
    });
  });

  describe("Presence/Absence Checks (* and ~)", () => {
    it("should filter for properties that are PRESENT (*)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, ["cache:*"]);
      expect(result).toHaveLength(3);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "vue-component-lib",
        "ts-node-cli",
      ]);
    });

    it("should filter for properties that are MISSING (~)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, ["cache:~"]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("js-frontend-app");

      const result2 = filterTemplatesByWhereClause(sampleTemplates, [
        "alias:~",
      ]);
      expect(result2).toHaveLength(1);
      expect(result2[0]![0]).toBe("vue-component-lib");
    });

    it("should combine presence/absence with substring match (pm=npm AND cache=*)", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:npm",
        "cache:*",
      ]);
      expect(result).toHaveLength(2);
      expect(result.map(([name]) => name)).toEqual([
        "ts-express-api",
        "vue-component-lib",
      ]);
    });

    it("should combine presence/absence with regex match", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "loc:*",
        "loc:/local/",
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]![0]).toBe("js-frontend-app");
    });
  });

  describe("Error and Warning Handling", () => {
    it("should log a warning and ignore a clause missing a delimiter", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:npm",
        "invalidclause",
      ]);

      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        `${DELIMITER_MISSING_KEY}- options delimiter1::, delimiter2:=, clause:invalidclause`,
      );
      expect(result).toHaveLength(2);
    });

    it("should log a warning and ignore an unrecognized property key", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:npm",
        "size:large",
      ]);

      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        `${PROPERTY_UNRECOGNIZED_KEY}- options property:size`,
      );
      expect(result).toHaveLength(2);
    });

    it("should log an error and ignore a clause with invalid regex", () => {
      const invalidRegexClause = "name:/[a-z/";
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "pm:npm",
        invalidRegexClause,
      ]);

      expect(mockLogger.error).toHaveBeenCalledOnce();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `${REGEX_INVALID_KEY}- options clause:${invalidRegexClause}, error:`,
        ),
      );
      expect(result).toHaveLength(2);
    });

    it("should return all templates if all clauses are invalid/ignored", () => {
      const result = filterTemplatesByWhereClause(sampleTemplates, [
        "invalid:clause",
        "another-bad-clause",
        "unknown:prop",
        "name:/[a-z/",
      ]);

      expect(mockLogger.warning).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(result).toEqual(allTemplateEntries);
    });
  });
});
