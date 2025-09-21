import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockInstance,
} from "vitest";
import {
  printSettings,
  printTemplates,
} from "../../../../src/utils/templates/printer.js";

describe("print-utils", () => {
  let mockConsoleLog: MockInstance;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

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
      expect(mockConsoleLog).toHaveBeenCalledTimes(5);
      expect(mockConsoleLog).toHaveBeenCalledWith("\nTYPESCRIPT:");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        " - node-ts-api (cli.add_template.options.alias: nta)\n    cli.add_template.options.description: A simple Node.js API with TypeScript\n    Location: https://github.com/devkit/node-ts-api\n    cli.add_template.options.cache: daily\n    cli.add_template.options.package_manager: npm\n",
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        " - react-component \n    cli.add_template.options.description: A reusable React component\n    Location: /local/path/to/template\n",
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        " - next-app (cli.add_template.options.alias: nextjs)\n    cli.add_template.options.description: A Next.js application template\n",
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(" - simple-template \n");
    });

    it("should print only filtered templates by name", () => {
      printTemplates("typescript", templates, "react");
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      expect(mockConsoleLog).toHaveBeenCalledWith("\nTYPESCRIPT:");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        " - react-component \n    cli.add_template.options.description: A reusable React component\n    Location: /local/path/to/template\n",
      );
    });

    it("should print only filtered templates by alias", () => {
      printTemplates("javascript", templates, "nta");
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      expect(mockConsoleLog).toHaveBeenCalledWith("\nJAVASCRIPT:");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        " - node-ts-api (cli.add_template.options.alias: nta)\n    cli.add_template.options.description: A simple Node.js API with TypeScript\n    Location: https://github.com/devkit/node-ts-api\n    cli.add_template.options.cache: daily\n    cli.add_template.options.package_manager: npm\n",
      );
    });

    it("should not print anything if no templates match the filter", () => {
      printTemplates("python", templates, "unrelated");
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("should not print anything if templates are empty", () => {
      printTemplates("rust", {});
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("printSettings", () => {
    it("should print all settings correctly", () => {
      printSettings(settings);
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenCalledWith("  packageManager: pnpm");
      expect(mockConsoleLog).toHaveBeenCalledWith("  cacheStrategy: daily");
      expect(mockConsoleLog).toHaveBeenCalledWith("  language: en");
    });

    it("should not print anything if settings object is empty", () => {
      printSettings({});
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });
});
