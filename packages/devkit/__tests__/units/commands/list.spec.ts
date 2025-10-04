import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupListCommand } from "../../../src/commands/list.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import type { CliConfig } from "../../../src/utils/schema/schema.js";
import { mockSpinner, mockLogger, mocktFn } from "../../../vitest.setup.js";

type AnnotatedTemplate = {
  _language: string;
  name: string;
  description: string;
  location: string;
  packageManager?: string;
  cacheStrategy?: string;
};

const MOCK_ANNOTATED_TEMPLATES: AnnotatedTemplate[] = [
  {
    _language: "javascript",
    name: "javascript-node",
    description: "Node.js project template",
    location: "/path/to/local/templates/javascript-node",
    packageManager: "npm",
  },
  {
    _language: "typescript",
    name: "typescript-express",
    description: "Express.js project template with TypeScript",
    location: "/path/to/global/templates/typescript-express",
    packageManager: "yarn",
  },
  {
    _language: "nodejs",
    name: "node-api",
    description: "Generic Node API project",
    location: "/path/to/global/templates/node-api",
    packageManager: "pnpm",
  },
];

const MOCK_CLI_CONFIG_WITH_SETTINGS: CliConfig = {
  settings: {
    defaultPackageManager: "npm" as const,
    cacheStrategy: "daily" as const,
    language: "en" as const,
  },
  templates: {
    javascript: { templates: {} },
    typescript: { templates: {} },
    nodejs: { templates: {} },
  },
};

const {
  mockGetAnnotatedTemplates,
  mockPrintTemplates,
  mockPrintSettings,
  mockGetMergedConfig,
  mockValidateProgrammingLanguage,
  mockValidateDisplayMode,
  mockHandleErrorAndExit,
  mockMapLanguageAliasToCanonicalKey,
} = vi.hoisted(() => {
  return {
    mockGetAnnotatedTemplates: vi.fn(),
    mockPrintTemplates: vi.fn(),
    mockPrintSettings: vi.fn(),
    mockGetMergedConfig: vi.fn(),
    mockValidateProgrammingLanguage: vi.fn(),
    mockHandleErrorAndExit: vi.fn(),
    mockValidateDisplayMode: vi.fn(),
    mockMapLanguageAliasToCanonicalKey: vi.fn((lang) => lang),
  };
});

let actionFn: Function;
const mockProgram = {
  command: vi.fn().mockReturnThis(),
  alias: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  argument: vi.fn().mockReturnThis(),
  option: vi.fn().mockReturnThis(),
  action: vi.fn((fn) => {
    actionFn = fn;
    return mockProgram;
  }),
};

vi.mock("#core/template/annotator.js", () => ({
  getAnnotatedTemplates: mockGetAnnotatedTemplates,
}));

vi.mock("#core/template/printer.js", () => ({
  printTemplates: mockPrintTemplates,
  printSettings: mockPrintSettings,
}));

vi.mock("#core/config/merger.js", () => ({
  getMergedConfig: mockGetMergedConfig,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
  validateDisplayMode: mockValidateDisplayMode,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/language.js", () => ({
  mapLanguageAliasToCanonicalKey: mockMapLanguageAliasToCanonicalKey,
}));

const CMD_DESCRIPTION_KEY = "commands.list.command.description";
const LANG_ARGUMENT_KEY = "commands.list.command.language.argument";
const GLOBAL_OPTION_KEY = "commands.list.options.global";
const ALL_OPTION_KEY = "commands.list.options.all";
const SETTINGS_OPTION_KEY = "commands.list.options.settings";
const INCLUDE_DEFAULTS_OPTION_KEY = "commands.list.options.include_defaults";
const WHERE_OPTION_KEY = "commands.list.command.where.option";
const MODE_OPTION_KEY = "commands.list.command.mode.option";
const HEADER_KEY = "commands.list.output.header";
const SETTINGS_HEADER_KEY = "commands.list.output.settings_header";
const MUTUALLY_EXCLUSIVE_KEY = "errors.command.mutually_exclusive_options";
const SUCCESS_CONFIG_LOADED_KEY = "messages.success.config_loaded";
const WARNING_TEMPLATE_NOT_FOUND_KEY =
  "warnings.template.not_found_for_language";

describe("list command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnnotatedTemplates.mockResolvedValue(MOCK_ANNOTATED_TEMPLATES);
    mockGetMergedConfig.mockResolvedValue(MOCK_CLI_CONFIG_WITH_SETTINGS);
    mockMapLanguageAliasToCanonicalKey.mockImplementation((lang) => lang);
  });

  it("should define the list command correctly with new options", () => {
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
      "-s, --settings",
      SETTINGS_OPTION_KEY,
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
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-d, --include-defaults",
      INCLUDE_DEFAULTS_OPTION_KEY,
      false,
    );
  });

  it("should call getAnnotatedTemplates with correct flags for default behavior (no options)", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { mode: "tree" });

    expect(mockGetAnnotatedTemplates).toHaveBeenCalledOnce();
    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: false,
    });

    expect(mockPrintTemplates).toHaveBeenCalledOnce();
    expect(mockPrintTemplates).toHaveBeenCalledWith(
      MOCK_ANNOTATED_TEMPLATES,
      [],
      "tree",
    );

    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      expect.stringContaining(SUCCESS_CONFIG_LOADED_KEY),
    );

    expect(mockLogger.log).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(`\n${HEADER_KEY}`),
    );
  });

  it("should map language alias (e.g., 'ts') to canonical key and filter correctly", async () => {
    setupListCommand({ program: mockProgram });
    const alias = "ts";
    const canonical = "typescript";

    mockMapLanguageAliasToCanonicalKey.mockReturnValue(canonical);

    await actionFn(alias, { mode: "tree" });

    expect(mockMapLanguageAliasToCanonicalKey).toHaveBeenCalledWith(alias);
    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(canonical);

    const expectedTemplates = MOCK_ANNOTATED_TEMPLATES.filter(
      (t) => t._language === canonical,
    );

    expect(mockPrintTemplates).toHaveBeenCalledWith(
      expectedTemplates,
      [],
      "tree",
    );
  });

  it("should pass mergeAll: true to annotator with --all flag", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { all: true, mode: "table" });

    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: true,
      includeDefaults: false,
    });
    expect(mockPrintTemplates).toHaveBeenCalledWith(
      MOCK_ANNOTATED_TEMPLATES,
      [],
      "table",
    );
  });

  it("should pass forceGlobal: true to annotator with --global flag", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { global: true, mode: "tree" });

    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: false,
    });
  });

  it("should filter templates by language argument", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("javascript", { mode: "tree" });

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith("javascript");

    const expectedTemplates = MOCK_ANNOTATED_TEMPLATES.filter(
      (t) => t._language === "javascript",
    );

    expect(mockPrintTemplates).toHaveBeenCalledWith(
      expectedTemplates,
      [],
      "tree",
    );
  });

  it("should pass the 'where' clauses directly to printTemplates", async () => {
    const whereClauses = ["pm:npm", "desc:project"];
    setupListCommand({ program: mockProgram });
    await actionFn("", { where: whereClauses, mode: "tree" });

    expect(mockPrintTemplates).toHaveBeenCalledWith(
      MOCK_ANNOTATED_TEMPLATES,
      whereClauses,
      "tree",
    );
  });

  it("should print settings when --settings is used (and call config merger)", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { settings: true, mode: "tree" });

    expect(mockGetMergedConfig).toHaveBeenCalledOnce();
    expect(mockGetMergedConfig).toHaveBeenCalledWith(false);

    expect(mockPrintSettings).toHaveBeenCalledWith(
      MOCK_CLI_CONFIG_WITH_SETTINGS.settings,
    );

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining(`\n${SETTINGS_HEADER_KEY}`),
    );

    expect(mockPrintTemplates).toHaveBeenCalledTimes(1);
  });

  it("should call getMergedConfig(true) when --settings and --all are used", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { settings: true, all: true, mode: "tree" });

    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);
  });

  it("should pass includeDefaults: true to annotator with --include-defaults flag", async () => {
    setupListCommand({ program: mockProgram });
    await actionFn("", { includeDefaults: true, mode: "tree" });

    expect(mockGetAnnotatedTemplates).toHaveBeenCalledWith({
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: true,
    });
  });

  it("should throw a DevkitError if both --global and --all flags are used", async () => {
    setupListCommand({ program: mockProgram });

    const expectedErrorMessage = mocktFn(MUTUALLY_EXCLUSIVE_KEY, {
      options: "global, all",
    });
    const expectedError = new DevkitError(expectedErrorMessage);

    await actionFn("", { global: true, all: true, mode: "table" });

    expect(mockGetAnnotatedTemplates).not.toHaveBeenCalled();

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expectedError,
      mockSpinner,
    );
  });

  it("should show a warning message if no templates are found after language filter", async () => {
    mockGetAnnotatedTemplates.mockResolvedValue([]);

    setupListCommand({ program: mockProgram });
    const language = "nonexistent";

    await actionFn(language, { mode: "tree" });

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(language);

    expect(mockSpinner.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        mocktFn(WARNING_TEMPLATE_NOT_FOUND_KEY, { language }),
      ),
    );

    expect(mockPrintTemplates).not.toHaveBeenCalled();
    expect(mockLogger.log).not.toHaveBeenCalledWith(
      expect.stringContaining(`\n${HEADER_KEY}`),
    );
  });

  it("should call handleErrorAndExit for errors during processing (e.g., invalid mode)", async () => {
    const modeError = new DevkitError("Invalid mode");
    mockValidateDisplayMode.mockImplementationOnce(() => {
      throw modeError;
    });

    setupListCommand({ program: mockProgram });
    await actionFn("javascript", { mode: "folder" });

    expect(mockValidateDisplayMode).toHaveBeenCalledOnce();
    expect(mockValidateDisplayMode).toHaveBeenCalledWith("folder");

    expect(mockHandleErrorAndExit).toHaveBeenCalledOnce();
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(modeError, mockSpinner);
  });
});
