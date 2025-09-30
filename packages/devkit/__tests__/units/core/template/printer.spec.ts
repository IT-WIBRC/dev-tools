import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  printSettings,
  printTemplates,
} from "../../../../src/core/template/printer.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";

const NEW_ALIAS_KEY = "commands.template.add.options.alias";
const NEW_DESCRIPTION_KEY = "commands.template.add.options.description";
const NEW_CACHE_KEY = "commands.template.add.options.cache";
const NEW_PM_KEY = "commands.template.add.options.package_manager";

describe("print-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const c: any = mockLogger.colors;
  const t = mocktFn;

  const templates = {
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
    },
    "simple-template": {},
  };

  const settings = {
    packageManager: "pnpm",
    cacheStrategy: "daily",
    language: "en",
  };

  describe("printTemplates", () => {
    it("should print all templates without a filter", () => {
      printTemplates("typescript", templates);

      expect(mockLogger.log).toHaveBeenCalledTimes(5);

      printTemplates("typescript", templates);

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
        ` - ${c.green("next-app")} ${c.cyanDim(`(${t(NEW_ALIAS_KEY)}: nextjs)`)}${c.dim(`\n    ${t(NEW_DESCRIPTION_KEY)}`)}: A Next.js application template\n`,
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        ` - ${c.green("simple-template")} \n`,
      );

      mockLogger.log.mockRestore();
    });

    it("should print only filtered templates by name", () => {
      printTemplates("typescript", templates, "react");

      printTemplates("typescript", templates, "react");

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
      printTemplates("javascript", templates, "nta");
      printTemplates("javascript", templates, "nta");

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
      printTemplates("python", templates, "unrelated");
      expect(mockLogger.log).not.toHaveBeenCalled();

      printTemplates("python", templates, "unrelated");
      expect(mockLogger.log).not.toHaveBeenCalled();
      mockLogger.log.mockRestore();
    });

    it("should not print anything if templates are empty", () => {
      printTemplates("rust", {});
      expect(mockLogger.log).not.toHaveBeenCalled();

      printTemplates("rust", {});
      expect(mockLogger.log).not.toHaveBeenCalled();
      mockLogger.log.mockRestore();
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
