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
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockScaffoldProject: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
  mockGetMergedConfig: vi.fn(),
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

const LANGUAGE_NOT_FOUND_KEY = "errors.scaffolding.language_not_found";
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

  it("should throw a DevkitError if the language config is not found in the merged config", async () => {
    mockGetMergedConfig.mockResolvedValue(sampleConfig);

    setupNewCommand({ program: mockProgram });
    const language = "python";
    const projectName = "my-python-project";
    const cmdOptions = { template: "my-template" };

    const expectedErrorMessage = mocktFn(LANGUAGE_NOT_FOUND_KEY, {
      language: "python",
    });

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(expectedErrorMessage),
      expect.any(Object),
    );
    expect(mockScaffoldProject).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if the specified template is not found by name or alias", async () => {
    setupNewCommand({ program: mockProgram });
    const language = "javascript";
    const projectName = "my-project";
    const templateName = "non-existent-template";
    const cmdOptions = { template: templateName };

    const expectedErrorMessage = mocktFn(TEMPLATE_NOT_FOUND_KEY, {
      template: templateName,
    });

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(expectedErrorMessage),
      expect.any(Object),
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

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      mockError,
      expect.any(Object),
    );
  });

  it("should throw a DevkitError if the language is not valid (before config lookup)", async () => {
    mockValidateProgrammingLanguage.mockImplementation(() => {
      throw new DevkitError("Invalid language");
    });

    setupNewCommand({ program: mockProgram });
    const language = "badlang";
    const projectName = "my-project";
    const cmdOptions = { template: "react-app" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(language);
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      expect.any(DevkitError),
      expect.any(Object),
    );
    expect(mockGetMergedConfig).not.toHaveBeenCalled();
  });
});
