import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupNewCommand } from "../../../src/commands/new.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner, mocktFn } from "../../../vitest.setup.js";
import type { CliConfig } from "../../../src/utils/schema/schema.js";

const {
  mockHandleErrorAndExit,
  mockScaffoldProject,
  mockValidateProgrammingLanguage,
  mockGetMergedConfig,
  mockMapLanguageAliasToCanonicalKey,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockScaffoldProject: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
  mockGetMergedConfig: vi.fn(),
  mockMapLanguageAliasToCanonicalKey: vi.fn((lang) => lang),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#core/config/merger.js", () => ({
  getMergedConfig: mockGetMergedConfig,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#scaffolding/javascript.js", () => ({
  scaffoldProject: mockScaffoldProject,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("#core/config/language.js", () => ({
  mapLanguageAliasToCanonicalKey: mockMapLanguageAliasToCanonicalKey,
}));

const TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const NEW_PROJECT_SUCCESS_KEY = "messages.success.new_project";
const CMD_DESCRIPTION_KEY = "commands.new.command.description";
const LANG_ARGUMENT_KEY = "commands.new.project.language.argument";
const NAME_ARGUMENT_KEY = "commands.new.project.name.argument";
const TEMPLATE_OPTION_KEY = "commands.new.project.template.option.description";

describe("setupNewCommand", () => {
  let mockProgram: any;

  const sampleConfig: CliConfig = {
    templates: {
      javascript: {
        templates: {
          "react-app": {
            description: "React application template",
            location: "https://github.com/react-app",
            packageManager: "yarn",
            cacheStrategy: "always-refresh",
          },
          "vue-alias": {
            description: "Vue app with an alias",
            location: "https://github.com/vue-app",
            alias: "vue",
          },
        },
      },
      typescript: {
        templates: {
          "ts-node": {
            description: "TypeScript Node project",
            location: "https://github.com/ts-node",
          },
        },
      },
      nodejs: {
        templates: {
          "node-api": {
            description: "Node.js API template",
            location: "https://github.com/node-api",
            alias: "node",
          },
        },
      },
    },
    settings: {
      defaultPackageManager: "npm",
      cacheStrategy: "daily",
      language: "en",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockGetMergedConfig.mockResolvedValue(sampleConfig);
    mockMapLanguageAliasToCanonicalKey.mockImplementation((lang) => lang);

    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      requiredOption: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the new command correctly and use the translator 't'", () => {
    setupNewCommand({ program: mockProgram });

    expect(mockProgram.command).toHaveBeenCalledWith("new");
    expect(mockProgram.alias).toHaveBeenCalledWith("nw");
    expect(mockProgram.description).toHaveBeenCalledWith(CMD_DESCRIPTION_KEY);
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<language>",
      LANG_ARGUMENT_KEY,
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<projectName>",
      NAME_ARGUMENT_KEY,
    );
    expect(mockProgram.requiredOption).toHaveBeenCalledWith(
      "-t, --template <string>",
      TEMPLATE_OPTION_KEY,
    );
  });

  it("should scaffold a project using the specified template name and its specific settings", async () => {
    setupNewCommand({ program: mockProgram });
    const language = "javascript";
    const projectName = "react-project";
    const templateName = "react-app";
    const templateConfig =
      sampleConfig?.templates?.javascript?.templates[templateName];
    const cmdOptions = { template: templateName };

    await actionFn(language, projectName, cmdOptions);

    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);

    expect(mockScaffoldProject).toHaveBeenCalledWith({
      projectName,
      templateConfig,
      packageManager: templateConfig?.packageManager,
      cacheStrategy: templateConfig?.cacheStrategy,
    });

    expect(mockSpinner.start).toHaveBeenCalledOnce();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      `${NEW_PROJECT_SUCCESS_KEY}- options projectName:react-project`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should map a language alias (e.g., 'ts') to its canonical key and scaffold", async () => {
    setupNewCommand({ program: mockProgram });
    const aliasLanguage = "ts";
    const canonicalLanguage = "typescript";
    const projectName = "ts-project";
    const templateName = "ts-node";
    const templateConfig =
      sampleConfig?.templates?.typescript?.templates[templateName];
    const cmdOptions = { template: templateName };

    mockMapLanguageAliasToCanonicalKey.mockReturnValue(canonicalLanguage);

    await actionFn(aliasLanguage, projectName, cmdOptions);

    expect(mockMapLanguageAliasToCanonicalKey).toHaveBeenCalledWith(
      aliasLanguage,
    );
    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
      canonicalLanguage,
    );
    expect(mockGetMergedConfig).toHaveBeenCalledWith(true);
    expect(mockScaffoldProject).toHaveBeenCalledWith({
      projectName,
      templateConfig,
      packageManager: sampleConfig.settings.defaultPackageManager,
      cacheStrategy: sampleConfig.settings.cacheStrategy,
    });
  });

  it("should scaffold a project using a template alias and global default settings", async () => {
    setupNewCommand({ program: mockProgram });
    const language = "javascript";
    const projectName = "vue-project";
    const templateAlias = "vue";
    const templateConfig =
      sampleConfig?.templates?.javascript?.templates["vue-alias"];
    const cmdOptions = { template: templateAlias };

    await actionFn(language, projectName, cmdOptions);

    expect(mockScaffoldProject).toHaveBeenCalledWith({
      projectName,
      templateConfig,
      packageManager: sampleConfig.settings.defaultPackageManager,
      cacheStrategy: sampleConfig.settings.cacheStrategy,
    });

    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      `${NEW_PROJECT_SUCCESS_KEY}- options projectName:vue-project`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if the language is not valid (python)", async () => {
    setupNewCommand({ program: mockProgram });
    const language = "python";
    const projectName = "my-python-project";
    const cmdOptions = { template: "my-template" };

    const expectedError = new DevkitError("Invalid language");
    mockMapLanguageAliasToCanonicalKey.mockReturnValue(language);

    mockValidateProgrammingLanguage.mockImplementation(() => {
      throw expectedError;
    });

    await actionFn(language, projectName, cmdOptions);

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(language);
    expect(mockGetMergedConfig).not.toHaveBeenCalled();

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expectedError,
      mockSpinner,
    );
    expect(mockScaffoldProject).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if the specified template is not found by name or alias", async () => {
    vi.restoreAllMocks();
    mockGetMergedConfig.mockClear();
    mockGetMergedConfig.mockResolvedValueOnce(sampleConfig);
    setupNewCommand({ program: mockProgram });
    const language = "javascript";
    const projectName = "my-project";
    const templateName = "non-existent-template";
    const cmdOptions = { template: templateName };

    const expectedErrorMessage = mocktFn(TEMPLATE_NOT_FOUND_KEY, {
      template: templateName,
    });
    const expectedError = new DevkitError(expectedErrorMessage);

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expectedError,
      mockSpinner,
    );
    expect(mockScaffoldProject).not.toHaveBeenCalled();
  });

  it("should handle an error during the project scaffolding process", async () => {
    const mockError = new Error("Scaffolding failed");
    mockScaffoldProject.mockRejectedValue(mockError);

    setupNewCommand({ program: mockProgram });
    const language = "javascript";
    const projectName = "my-project";
    const cmdOptions = { template: "react-app" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });

  it("should throw a DevkitError if the language is not valid (before config lookup)", async () => {
    const expectedError = new DevkitError("Invalid language");
    mockValidateProgrammingLanguage.mockImplementation(() => {
      throw expectedError;
    });

    setupNewCommand({ program: mockProgram });
    const language = "badlang";
    const projectName = "my-project";
    const cmdOptions = { template: "react-app" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(language);
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expectedError,
      mockSpinner,
    );
    expect(mockGetMergedConfig).not.toHaveBeenCalled();
  });
});
