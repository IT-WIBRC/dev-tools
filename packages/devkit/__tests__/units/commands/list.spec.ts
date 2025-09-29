import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupListCommand } from "../../../src/commands/list";
import { DevkitError } from "../../../src/utils/errors/base";
import type { CliConfig } from "../../../src/utils/schema/schema";
import { mockChalk, mockSpinner } from "../../../vitest.setup";

const sampleLocalConfig: CliConfig = {
  settings: {
    defaultPackageManager: "npm",
    cacheStrategy: "daily",
    language: "en",
  },
  templates: {
    javascript: {
      templates: {
        "javascript-node": {
          description: "Node.js project template",
          location: "/path/to/local/templates/javascript-node",
        },
      },
    },
  },
};

const sampleGlobalConfig: CliConfig = {
  ...sampleLocalConfig,
  templates: {
    typescript: {
      templates: {
        "typescript-express": {
          description: "Express.js project template with TypeScript",
          location: "/path/to/global/templates/typescript-express",
        },
      },
    },
  },
};

const {
  mockReadAndMergeConfigs,
  mockPrintTemplates,
  mockValidateProgrammingLanguage,
  mockHandleErrorAndExit,
  mockProgram,
  consoleLogSpy,
} = vi.hoisted(() => {
  return {
    mockReadAndMergeConfigs: vi.fn(),
    mockPrintTemplates: vi.fn(),
    mockValidateProgrammingLanguage: vi.fn(),
    mockHandleErrorAndExit: vi.fn(),
    mockProgram: {
      command: vi.fn().mockReturnThis(),
      alias: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      argument: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn().mockReturnThis(),
    },
    consoleLogSpy: vi.spyOn(console, "log").mockImplementation(() => {}),
  };
});

vi.mock("#core/config/loader.js", () => ({
  readAndMergeConfigs: mockReadAndMergeConfigs,
}));

vi.mock("#core/template/printer.js", () => ({
  printTemplates: mockPrintTemplates,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

describe("list command", () => {
  let actionFn: Function;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProgram.command.mockReturnThis();
    mockProgram.alias.mockReturnThis();
    mockProgram.description.mockReturnThis();
    mockProgram.argument.mockReturnThis();
    mockProgram.option.mockReturnThis();
    mockProgram.action.mockImplementation((fn) => {
      actionFn = fn;
    });
    consoleLogSpy.mockClear();
  });

  it("should define the list command correctly", () => {
    setupListCommand({ program: mockProgram });

    expect(mockProgram.command).toHaveBeenCalledWith("list");
    expect(mockProgram.alias).toHaveBeenCalledWith("ls");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "list.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "[language]",
      "list.command.language.argument",
      "",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      "list.command.global.option",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-a, --all",
      "list.command.all.option",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-f, --filter <string>",
      "list.command.filter.option",
    );
    expect(mockProgram.option).not.toHaveBeenCalledWith(
      "-l, --local",
      expect.any(String),
    );
  });

  describe("display modes", () => {
    it("should display both local and global templates with --all flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone({
          templates: {
            ...sampleLocalConfig.templates,
            ...sampleGlobalConfig.templates,
          },
        }),
        source: "merged",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram });
      await actionFn("", { all: true });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_local_and_global",
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        {
          "javascript-node": {
            description: "Node.js project template",
            location: "/path/to/local/templates/javascript-node",
          },
        },
        undefined,
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "typescript",
        {
          "typescript-express": {
            description: "Express.js project template with TypeScript",
            location: "/path/to/global/templates/typescript-express",
          },
        },
        undefined,
      );
    });

    it("should display only global templates with --global flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleGlobalConfig),
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram });
      await actionFn("", { global: true });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_global",
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "typescript",
        {
          "typescript-express": {
            description: "Express.js project template with TypeScript",
            location: "/path/to/global/templates/typescript-express",
          },
        },
        undefined,
      );
    });

    it("should display only local templates by default when local config exists", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleLocalConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram, config: sampleLocalConfig });
      await actionFn("", {});

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_local",
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        {
          "javascript-node": {
            description: "Node.js project template",
            location: "/path/to/local/templates/javascript-node",
          },
        },
        undefined,
      );
    });

    it("should display templates for a specific language (e.g., javascript)", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone({
          templates: {
            ...sampleLocalConfig.templates,
            ...sampleGlobalConfig.templates,
          },
        }),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram });
      await actionFn("javascript", {
        all: false,
        global: false,
        filter: "",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_local",
      );
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith("\nlist.templates.header");

      expect(mockPrintTemplates).toHaveBeenCalledOnce();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        {
          "javascript-node": {
            description: "Node.js project template",
            location: "/path/to/local/templates/javascript-node",
          },
        },
        "",
      );
    });

    it("should display global templates if no local templates are found for a language", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone({
          templates: {
            ...sampleLocalConfig.templates,
          },
        }),
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupListCommand({ program: mockProgram });
      await actionFn("javascript", {
        all: false,
        global: false,
        filter: "javascript",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(
        "list.templates.using_global_fallback",
      );
      expect(mockPrintTemplates).toHaveBeenCalledOnce();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        {
          "javascript-node": {
            description: "Node.js project template",
            location: "/path/to/local/templates/javascript-node",
          },
        },
        "javascript",
      );
    });

    it("should display a message if no templates are found", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone({ templates: {} }),
        source: "empty",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);

      setupListCommand({ program: mockProgram });
      await actionFn("nonexistent", {
        all: false,
        global: false,
        filter: "",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "nonexistent",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockChalk.yellow("list.templates.not_found- options template:"),
      );
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(mockPrintTemplates).not.toHaveBeenCalled();
    });
  });

  describe("filter option", () => {
    beforeEach(() => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone({
          templates: {
            ...sampleLocalConfig.templates,
            ...sampleGlobalConfig.templates,
          },
        }),
        source: "merged",
      });
      mockValidateProgrammingLanguage.mockReturnValue(true);
    });

    it("should pass the filter string to printTemplates", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("", { all: true, global: false, filter: "vue" });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "javascript",
        {
          "javascript-node": {
            description: "Node.js project template",
            location: "/path/to/local/templates/javascript-node",
          },
        },
        "vue",
      );
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        "typescript",
        {
          "typescript-express": {
            description: "Express.js project template with TypeScript",
            location: "/path/to/global/templates/typescript-express",
          },
        },
        "vue",
      );
    });
  });

  describe("error handling", () => {
    it("should throw a DevkitError if both --global and --all flags are used", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("", { global: true, all: true });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          "error.command.mutually_exclusive_options- options options:global, all",
        ),
        mockSpinner,
      );
    });
  });
});
