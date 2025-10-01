import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  printSettings,
  printTemplates,
  type TemplateList,
} from "../../../../src/core/template/printer.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";
import type { LanguageConfig } from "../../../../src/utils/schema/schema.js";

const mockFilterTemplatesByWhereClause = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("../../../../src/core/template/filter.js", () => ({
  filterTemplatesByWhereClause: mockFilterTemplatesByWhereClause,
}));

const NEW_ALIAS_KEY = "commands.template.add.options.alias";
const NEW_DESCRIPTION_KEY = "commands.template.add.options.description";
const NEW_CACHE_KEY = "commands.template.add.options.cache";
const NEW_PM_KEY = "commands.template.add.options.package_manager";

mockLogger.table = vi.fn();

describe("print-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterTemplatesByWhereClause.mockImplementation((templates) =>
      Object.entries(templates),
    );
  });

  const c: any = mockLogger.colors;
  const t = mocktFn;

  const templates: LanguageConfig["templates"] = {
    "node-ts-api": {
      description: "A simple Node.js API with TypeScript",
      alias: "nta",
      location: "https://github.com/devkit/node-ts-api",
      cacheStrategy: "daily",
      packageManager: "npm",
    },
    "react-component": {
      description: "A reusable React component",
      location: "/local/path/to/template",
    },
    "next-app": {
      description: "A Next.js application template",
      alias: "nextjs",
      location: "/local/path/to/template",
    },
    "simple-template": {
      description: "A simple template",
      location: "/local/path/to/template",
    },
  };

  const settings = {
    packageManager: "pnpm",
    cacheStrategy: "daily",
    language: "en",
  };

  const filteredTemplatesReact = [
    ["react-component", templates["react-component"]] as TemplateList,
  ];

  const filteredTemplatesNTA = [
    ["node-ts-api", templates["node-ts-api"]] as TemplateList,
  ];

  describe("printTemplates (Mode `Tree`: Default)", () => {
    it("should print all templates without a filter", () => {
      mockFilterTemplatesByWhereClause.mockImplementationOnce(
        (templates, clauses) => {
          expect(clauses).toEqual([]);
          return Object.entries(templates);
        },
      );
      printTemplates([["typescript", templates]]);

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledOnce();
      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledWith(
        templates,
        [],
      );
      expect(mockLogger.log).toHaveBeenCalledTimes(5);

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("node-ts-api")} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nta)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple Node.js API with TypeScript${c.dim("\n    Location")}: https://github.com/devkit/node-ts-api${c.dim(`\n    ${t(NEW_CACHE_KEY)}`)}: daily${c.dim(`\n    ${t(NEW_PM_KEY)}`)}: npm\n`,
      );
    });

    it("should print only filtered templates by a filter clause array", () => {
      const filterClauses = ["name:react"];
      mockFilterTemplatesByWhereClause.mockImplementationOnce(
        (templates, clauses) => {
          expect(clauses).toEqual(filterClauses);
          return filteredTemplatesReact;
        },
      );

      printTemplates([["typescript", templates]], filterClauses);

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledOnce();
      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledWith(
        templates,
        filterClauses,
      );
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("TYPESCRIPT")}:`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("react-component")} ${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A reusable React component${c.dim("\n    Location")}: /local/path/to/template\n`,
      );
    });

    it("should not print anything if filter returns no templates", () => {
      const filterClauses = ["name:unrelated"];
      mockFilterTemplatesByWhereClause.mockReturnValueOnce([]);

      printTemplates([["python", templates]], filterClauses);

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledOnce();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it("should not print anything if templates are empty", () => {
      printTemplates([["rust", {}]]);

      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledOnce();
    });
  });

  describe("printTemplates (Mode `Table`)", () => {
    const templatesJs = { "express-api": { description: "Express" } };
    const templatesList = [
      ["typescript", templates],
      ["javascript", templatesJs],
    ];

    it("should call logger.table with all templates across multiple languages without a filter", () => {
      mockFilterTemplatesByWhereClause
        .mockImplementationOnce((templates, clauses) => {
          expect(clauses).toEqual([]);
          return Object.entries(templates);
        })
        .mockImplementationOnce((templates, clauses) => {
          expect(clauses).toEqual([]);
          return Object.entries(templates);
        });

      printTemplates(templatesList as TemplateList[], [], "table");

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(2);
      expect(mockLogger.table).toHaveBeenCalledTimes(1);

      const expectedTableData = [
        [
          c.bold("Language"),
          c.bold("Name"),
          c.bold("Alias"),
          c.bold("Description"),
          c.bold("Location"),
        ],
        [
          c.boldBlue("Typescript"),
          c.green("node-ts-api"),
          "nta",
          "A simple Node.js API with TypeScript",
          "https://github.com/devkit/node-ts-api",
        ],
        [
          c.boldBlue("Typescript"),
          c.green("react-component"),
          c.dim("N/A"),
          "A reusable React component",
          "/local/path/to/template",
        ],
        [
          c.boldBlue("Typescript"),
          c.green("next-app"),
          "nextjs",
          "A Next.js application template",
          "/local/path/to/template",
        ],
        [
          c.boldBlue("Typescript"),
          c.green("simple-template"),
          c.dim("N/A"),
          "A simple template",
          "/local/path/to/template",
        ],
        [
          c.boldBlue("Javascript"),
          c.green("express-api"),
          c.dim("N/A"),
          "Express",
          c.dim("N/A"),
        ],
      ];

      expect(mockLogger.table).toHaveBeenCalledWith(expectedTableData);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it("should print only filtered templates by a filter array in table mode", () => {
      const filterClauses = ["alias:nextjs"];
      mockFilterTemplatesByWhereClause
        .mockImplementationOnce(() => filteredTemplatesNTA)
        .mockImplementationOnce(() => []);

      printTemplates(templatesList as TemplateList[], filterClauses, "table");

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(2);
      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledWith(
        templates,
        filterClauses,
      );
      expect(mockLogger.table).toHaveBeenCalledTimes(1);

      const expectedTableData = [
        [
          c.bold("Language"),
          c.bold("Name"),
          c.bold("Alias"),
          c.bold("Description"),
          c.bold("Location"),
        ],
        [
          c.boldBlue("Typescript"),
          c.green("node-ts-api"),
          "nta",
          "A simple Node.js API with TypeScript",
          "https://github.com/devkit/node-ts-api",
        ],
      ];

      expect(mockLogger.table).toHaveBeenCalledWith(expectedTableData);
    });

    it("should call logger.warning with filter key if filter yields no templates", () => {
      const filterClauses = ["name:unrelated-app"];
      mockFilterTemplatesByWhereClause.mockReturnValue([]);

      printTemplates([["typescript", templates]], filterClauses, "table");

      expect(mockLogger.table).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template_not_found_with_filter",
      );
    });

    it("should call logger.warning without filter key if templates list is empty", () => {
      mockFilterTemplatesByWhereClause.mockReturnValue([]);
      printTemplates([["rust", {}]], [], "table");

      expect(mockLogger.table).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template_not_found",
      );
    });
  });

  describe("printSettings", () => {
    it("should print all settings correctly", () => {
      printSettings(settings);
      expect(mockLogger.log).toHaveBeenCalledTimes(3);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `${c.yellowBold("  packageManager:")} ${c.cyan("pnpm")}`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        `${c.yellowBold("  cacheStrategy:")} ${c.cyan("daily")}`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        `${c.yellowBold("  language:")} ${c.cyan("en")}`,
      );
    });

    it("should not print anything if settings object is empty", () => {
      printSettings({});
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
  });
});
