import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  printSettings,
  printTemplates,
} from "../../../../src/core/template/printer.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";
import { type AnnotatedTemplate } from "../../../../src/core/template/annotator.js";

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

const ANNOTATED_TEMPLATES: AnnotatedTemplate[] = [
  {
    _name: "node-ts-api",
    _language: "typescript",
    _source: "global",
    description: "A simple Node.js API with TypeScript",
    alias: "nta",
    location: "https://github.com/devkit/node-ts-api",
    cacheStrategy: "daily",
    packageManager: "npm",
  },
  {
    _name: "react-component",
    _language: "typescript",
    _source: "local",
    description: "A reusable React component",
    location: "/local/path/to/template",
  },
  {
    _name: "express-api",
    _language: "javascript",
    _source: "default",
    description: "A simple Express API",
    location: "/local/path/to/default-js-template",
  },
  {
    _name: "next-app",
    _language: "typescript",
    _source: "local",
    description: "A Next.js application template",
    alias: "nextjs",
    location: "/local/path/to/template",
  },
];

const settings = {
  packageManager: "pnpm",
  cacheStrategy: "daily",
  language: "en",
};

describe("print-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterTemplatesByWhereClause.mockImplementation((templateMap) =>
      Object.entries(templateMap),
    );
  });

  const c: any = mockLogger.colors;
  const t = mocktFn;

  const GLOBAL_TAG = c.magenta("(global)");
  const LOCAL_TAG = c.blue("(local)");
  const DEFAULT_TAG = c.dim("(default)");

  describe("printTemplates (Mode `Tree`: Default)", () => {
    it("should print all templates without a filter, grouped by language", () => {
      printTemplates(ANNOTATED_TEMPLATES, [], "tree");

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(4);

      expect(mockLogger.log).toHaveBeenCalledTimes(6);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("Typescript")}:`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("node-ts-api")} ${GLOBAL_TAG} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nta)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple Node.js API with TypeScript${c.dim("\n    Location")}: https://github.com/devkit/node-ts-api${c.dim(`\n    ${t(NEW_CACHE_KEY)}`)}: daily${c.dim(`\n    ${t(NEW_PM_KEY)}`)}: npm\n`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("Javascript")}:`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("express-api")} ${DEFAULT_TAG} ${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple Express API${c.dim("\n    Location")}: /local/path/to/default-js-template\n`,
      );
    });

    it("should print only filtered templates by a filter clause array", () => {
      const filterClauses = ["alias:nextjs"];
      mockFilterTemplatesByWhereClause.mockImplementation((templateMap) => {
        const templateName = Object.keys(templateMap)[0];
        return templateName === "next-app" ? Object.entries(templateMap) : [];
      });

      printTemplates(ANNOTATED_TEMPLATES, filterClauses);

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(4);

      expect(mockLogger.log).toHaveBeenCalledTimes(2);
      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("Typescript")}:`,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("next-app")} ${LOCAL_TAG} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nextjs)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A Next.js application template${c.dim("\n    Location")}: /local/path/to/template\n`,
      );
    });

    it("should call logger.warning with filter key if filter yields no templates", () => {
      const filterClauses = ["name:unrelated"];
      mockFilterTemplatesByWhereClause.mockReturnValue([]);

      printTemplates(ANNOTATED_TEMPLATES, filterClauses);

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(4);
      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template.not_found_with_filter",
      );
    });

    it("should call logger.warning without filter key if templates list is initially empty", () => {
      printTemplates([], []);

      expect(mockFilterTemplatesByWhereClause).not.toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template.not_found",
      );
    });
  });

  describe("printTemplates (Mode `Table`)", () => {
    it("should call logger.table with all templates including the new Source column", () => {
      mockFilterTemplatesByWhereClause.mockImplementation(() => [1]);

      printTemplates(ANNOTATED_TEMPLATES, [], "table");

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(4);
      expect(mockLogger.table).toHaveBeenCalledTimes(1);

      const expectedTableData = [
        [
          c.bold("Language"),
          c.bold("Name"),
          c.bold("Alias"),
          c.bold("Source"),
          c.bold("Description"),
          c.bold("Location"),
        ],
        [
          c.boldBlue("Typescript"),
          c.green("node-ts-api"),
          "nta",
          GLOBAL_TAG,
          "A simple Node.js API with TypeScript",
          "https://github.com/devkit/node-ts-api",
        ],
        [
          c.boldBlue("Typescript"),
          c.green("react-component"),
          c.dim("N/A"),
          LOCAL_TAG,
          "A reusable React component",
          "/local/path/to/template",
        ],
        [
          c.boldBlue("Javascript"),
          c.green("express-api"),
          c.dim("N/A"),
          DEFAULT_TAG,
          "A simple Express API",
          "/local/path/to/default-js-template",
        ],
        [
          c.boldBlue("Typescript"),
          c.green("next-app"),
          "nextjs",
          LOCAL_TAG,
          "A Next.js application template",
          "/local/path/to/template",
        ],
      ];

      expect(mockLogger.table).toHaveBeenCalledWith(expectedTableData);
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it("should filter templates correctly in table mode", () => {
      const filterClauses = ["language:javascript"];
      mockFilterTemplatesByWhereClause.mockImplementation((templateMap) => {
        const templateName = Object.keys(templateMap)[0];
        return templateName === "express-api"
          ? Object.entries(templateMap)
          : [];
      });

      printTemplates(ANNOTATED_TEMPLATES, filterClauses, "table");

      expect(mockFilterTemplatesByWhereClause).toHaveBeenCalledTimes(4);
      expect(mockLogger.table).toHaveBeenCalledTimes(1);

      const expectedTableData = [
        [
          c.bold("Language"),
          c.bold("Name"),
          c.bold("Alias"),
          c.bold("Source"),
          c.bold("Description"),
          c.bold("Location"),
        ],
        [
          c.boldBlue("Javascript"),
          c.green("express-api"),
          c.dim("N/A"),
          DEFAULT_TAG,
          "A simple Express API",
          "/local/path/to/default-js-template",
        ],
      ];

      expect(mockLogger.table).toHaveBeenCalledWith(expectedTableData);
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
