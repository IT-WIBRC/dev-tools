import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  printSettings,
  printTemplates,
} from "../../../../src/core/template/printer.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";
import type { LanguageConfig } from "../../../integrations/common.js";

const NEW_ALIAS_KEY = "commands.template.add.options.alias";
const NEW_DESCRIPTION_KEY = "commands.template.add.options.description";
const NEW_CACHE_KEY = "commands.template.add.options.cache";
const NEW_PM_KEY = "commands.template.add.options.package_manager";

mockLogger.table = vi.fn();

describe("print-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("printTemplates (Mode `Tree`: Default)", () => {
    it("should print all templates without a filter", () => {
      printTemplates([["typescript", templates]]);

      expect(mockLogger.log).toHaveBeenCalledTimes(5);

      printTemplates([["typescript", templates]]);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("TYPESCRIPT")}:`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("node-ts-api")} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nta)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple Node.js API with TypeScript${c.dim("\n    Location")}: https://github.com/devkit/node-ts-api${c.dim(`\n    ${t(NEW_CACHE_KEY)}`)}: daily${c.dim(`\n    ${t(NEW_PM_KEY)}`)}: npm\n`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("react-component")} ${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A reusable React component${c.dim("\n    Location")}: /local/path/to/template\n`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("next-app")} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nextjs)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A Next.js application template${c.dim("\n    Location")}: /local/path/to/template\n`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("simple-template")} ${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple template${c.dim("\n    Location")}: /local/path/to/template\n`,
      );

      mockLogger.log.mockRestore();
    });

    it("should print only filtered templates by name", () => {
      printTemplates([["typescript", templates]], "react");

      printTemplates([["typescript", templates]], "react");

      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("TYPESCRIPT")}:`,
      );
      expect(mockLogger.log).toHaveBeenCalledTimes(4);
      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("react-component")} ${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A reusable React component${c.dim("\n    Location")}: /local/path/to/template\n`,
      );

      mockLogger.log.mockRestore();
    });

    it("should print only filtered templates by alias", () => {
      printTemplates([["javascript", templates]], "nta");
      printTemplates([["javascript", templates]], "nta");

      expect(mockLogger.log).toHaveBeenCalledWith(
        `\n${c.boldBlue("JAVASCRIPT")}:`,
      );
      expect(mockLogger.log).toHaveBeenCalledTimes(4);
      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("node-ts-api")} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nta)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A simple Node.js API with TypeScript${c.dim("\n    Location")}: https://github.com/devkit/node-ts-api${c.dim(`\n    ${t(NEW_CACHE_KEY)}`)}: daily${c.dim(`\n    ${t(NEW_PM_KEY)}`)}: npm\n`,
      );

      mockLogger.log.mockRestore();
    });

    it("should not print anything if no templates match the filter", () => {
      printTemplates([["python", templates]], "unrelated");
      expect(mockLogger.log).not.toHaveBeenCalled();

      printTemplates([["python", templates]], "unrelated");
      expect(mockLogger.log).not.toHaveBeenCalled();
      mockLogger.log.mockRestore();
    });

    it("should not print anything if templates are empty", () => {
      printTemplates([["rust", {}]]);
      expect(mockLogger.log).not.toHaveBeenCalled();

      printTemplates([["rust", {}]]);
      expect(mockLogger.log).not.toHaveBeenCalled();
      mockLogger.log.mockRestore();
    });
  });

  describe("printTemplates (Mode `Table`)", () => {
    it("should call logger.table with all templates across multiple languages without a filter", () => {
      printTemplates(
        [
          ["typescript", templates],
          ["javascript", { "express-api": { description: "Express" } }],
        ],
        undefined,
        "table",
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
          c.dim("/local/path/to/template"),
        ],
        [
          c.boldBlue("Typescript"),
          c.green("simple-template"),
          c.dim("N/A"),
          c.dim("A simple template"),
          c.dim("/local/path/to/template"),
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

    it("should print only filtered templates by name or alias in table mode", () => {
      printTemplates([["typescript", templates]], "nextjs", "table");

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
          c.green("next-app"),
          "nextjs",
          "A Next.js application template",
          c.dim("/local/path/to/template"),
        ],
      ];

      expect(mockLogger.table).toHaveBeenCalledWith(expectedTableData);
    });

    it("should not call logger.table if no templates match the filter", () => {
      printTemplates([["typescript", templates]], "unrelated-app", "table");

      expect(mockLogger.table).not.toHaveBeenCalled();
    });

    it("should not call logger.table if templates list is empty", () => {
      printTemplates([["rust", {}]], undefined, "table");

      expect(mockLogger.table).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template_not_found",
      );
    });

    it("should not call logger.table if templates list is empty with filter applied", () => {
      printTemplates([["rust", {}]], "unrelated-app", "table");

      expect(mockLogger.table).not.toHaveBeenCalled();
      expect(mockLogger.warning).toHaveBeenCalledOnce();
      expect(mockLogger.warning).toHaveBeenCalledWith(
        "warnings.template_not_found_with_filter",
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
