import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupListCommand } from "../../../src/commands/list";
import { DevkitError } from "../../../src/utils/errors/base";
import type { CliConfig } from "../../../src/utils/schema/schema";
import { mockSpinner, mockLogger } from "../../../vitest.setup.js";

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
  mockValidateDisplayMode,
  mockHandleErrorAndExit,
  mockProgram,
} = vi.hoisted(() => {
  return {
    mockReadAndMergeConfigs: vi.fn(),
    mockPrintTemplates: vi.fn(),
    mockValidateProgrammingLanguage: vi.fn(),
    mockHandleErrorAndExit: vi.fn(),
    mockValidateDisplayMode: vi.fn(),
    mockProgram: {
      command: vi.fn().mockReturnThis(),
      alias: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      argument: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn().mockReturnThis(),
    },
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
  validateDisplayMode: mockValidateDisplayMode,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

const CMD_DESCRIPTION_KEY = "commands.list.command.description";
const LANG_ARGUMENT_KEY = "commands.list.command.language.argument";
const GLOBAL_OPTION_KEY = "commands.list.options.global";
const ALL_OPTION_KEY = "commands.list.options.all";
const WHERE_OPTION_KEY = "commands.list.command.where.option";
const MODE_OPTION_KEY = "commands.list.command.mode.option";

const USING_LOCAL_GLOBAL_KEY = "messages.config_source.using_local_and_global";
const USING_GLOBAL_KEY = "messages.config_source.global";
const USING_LOCAL_KEY = "messages.config_source.local";
const GLOBAL_FALLBACK_KEY = "messages.config_source.global_fallback";
const TEMPLATE_NOT_FOUND_KEY = "warnings.template_not_found";
const HEADER_KEY = "commands.list.output.header";
const MUTUALLY_EXCLUSIVE_KEY = "errors.command.mutually_exclusive_options";

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
  });

  it("should define the list command correctly", () => {
    setupListCommand({ program: mockProgram });

    expect(mockProgram.command).toHaveBeenCalledWith("list");
    expect(mockProgram.alias).toHaveBeenCalledWith("ls");
    expect(mockProgram.description).toHaveBeenCalledWith(CMD_DESCRIPTION_KEY);
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "[language]",
      LANG_ARGUMENT_KEY,
      "",
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      GLOBAL_OPTION_KEY,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-a, --all",
      ALL_OPTION_KEY,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-w, --where <strings...>",
      WHERE_OPTION_KEY,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-m, --mode <string>",
      MODE_OPTION_KEY,
      "tree",
    );
    expect(mockProgram.option).not.toHaveBeenCalledWith(
      "-f, --filter <string>",
      expect.any(String),
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
      mockValidateDisplayMode.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram });
      await actionFn("", { all: true, mode: "tree" });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(USING_LOCAL_GLOBAL_KEY);
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "javascript",
            {
              "javascript-node": {
                description: "Node.js project template",
                location: "/path/to/local/templates/javascript-node",
              },
            },
          ],
          [
            "typescript",
            {
              "typescript-express": {
                description: "Express.js project template with TypeScript",
                location: "/path/to/global/templates/typescript-express",
              },
            },
          ],
        ],
        [],
        "tree",
      );
    });

    it("should display only global templates with --global flag", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleGlobalConfig),
        source: "global",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram });
      await actionFn("", { global: true, mode: "tree" });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(USING_GLOBAL_KEY);
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "typescript",
            {
              "typescript-express": {
                description: "Express.js project template with TypeScript",
                location: "/path/to/global/templates/typescript-express",
              },
            },
          ],
        ],
        [],
        "tree",
      );
    });

    it("should display only local templates by default when local config exists", async () => {
      mockReadAndMergeConfigs.mockResolvedValueOnce({
        config: structuredClone(sampleLocalConfig),
        source: "local",
      });
      mockValidateProgrammingLanguage.mockReturnValueOnce(true);
      mockValidateDisplayMode.mockReturnValueOnce(true);

      setupListCommand({ program: mockProgram, config: sampleLocalConfig });
      await actionFn("", { mode: "table" });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(USING_LOCAL_KEY);
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "javascript",
            {
              "javascript-node": {
                description: "Node.js project template",
                location: "/path/to/local/templates/javascript-node",
              },
            },
          ],
        ],
        [],
        "table",
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
        where: ["name:node"],
        mode: "table",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(USING_LOCAL_KEY);
      expect(mockLogger.log).toHaveBeenCalledTimes(1);
      expect(mockLogger.log).toHaveBeenCalledWith(`\n${HEADER_KEY}`);

      expect(mockPrintTemplates).toHaveBeenCalledOnce();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "javascript",
            {
              "javascript-node": {
                description: "Node.js project template",
                location: "/path/to/local/templates/javascript-node",
              },
            },
          ],
        ],
        ["name:node"],
        "table",
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
        where: ["loc:local"],
        mode: "tree",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(2);
      expect(mockSpinner.info).toHaveBeenCalledWith(GLOBAL_FALLBACK_KEY);
      expect(mockPrintTemplates).toHaveBeenCalledOnce();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "javascript",
            {
              "javascript-node": {
                description: "Node.js project template",
                location: "/path/to/local/templates/javascript-node",
              },
            },
          ],
        ],
        ["loc:local"],
        "tree",
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
        where: [],
        mode: "tree",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "nonexistent",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          `${TEMPLATE_NOT_FOUND_KEY}- options template:`,
        ),
      );
      expect(mockLogger.log).not.toHaveBeenCalled();
      expect(mockPrintTemplates).not.toHaveBeenCalled();
    });

    it("should throw an error when the mode is invalid", async () => {
      mockReadAndMergeConfigs.mockResolvedValue({
        config: structuredClone({
          templates: {
            ...sampleLocalConfig.templates,
          },
        }),
        source: "global",
      });
      const modeError = new DevkitError("Invalid mode");
      mockValidateProgrammingLanguage.mockReturnValue(true);
      mockValidateDisplayMode.mockImplementationOnce(() => {
        throw modeError;
      });

      setupListCommand({ program: mockProgram });
      await actionFn("javascript", {
        all: false,
        global: false,
        where: ["cache:daily"],
        mode: "folder",
      });

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.stop).toHaveBeenCalledTimes(1);
      expect(mockSpinner.info).toHaveBeenCalledWith(GLOBAL_FALLBACK_KEY);
      expect(mockPrintTemplates).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        modeError,
        mockSpinner,
      );
    });
  });

  describe("where option", () => {
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

    it("should pass the array of where clauses to printTemplates", async () => {
      const whereClauses = ["pm:npm", "desc:express"];
      setupListCommand({ program: mockProgram });
      await actionFn("", {
        all: true,
        global: false,
        where: whereClauses,
        mode: "tree",
      });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockPrintTemplates).toHaveBeenCalledWith(
        [
          [
            "javascript",
            {
              "javascript-node": {
                description: "Node.js project template",
                location: "/path/to/local/templates/javascript-node",
              },
            },
          ],
          [
            "typescript",
            {
              "typescript-express": {
                description: "Express.js project template with TypeScript",
                location: "/path/to/global/templates/typescript-express",
              },
            },
          ],
        ],
        whereClauses,
        "tree",
      );
    });

    it("should pass an empty array to printTemplates when --where is not used", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("", {
        all: true,
        global: false,
        mode: "tree",
      });

      expect(mockPrintTemplates).toHaveBeenCalledWith(
        expect.any(Array),
        [],
        "tree",
      );
    });
  });

  describe("error handling", () => {
    it("should throw a DevkitError if both --global and --all flags are used", async () => {
      setupListCommand({ program: mockProgram });
      await actionFn("", { global: true, all: true, mode: "table" });

      expect(mockValidateProgrammingLanguage).not.toHaveBeenCalled();
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(
          `${MUTUALLY_EXCLUSIVE_KEY}- options options:global, all`,
        ),
        mockSpinner,
      );
    });
  });
});
