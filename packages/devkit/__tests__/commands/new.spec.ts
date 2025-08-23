import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupNewCommand } from "../../src/commands/new.js";
import { DevkitError } from "../../src/utils/errors/base.js";
import { mockSpinner } from "../../vitest.setup.js";
import type { CliConfig } from "../../src/utils/configs/schema.js";

const { mockHandleErrorAndExit, mockScaffoldProject } = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockScaffoldProject: vi.fn(),
}));

let actionFn: any;
vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#scaffolding/javascript.js", () => ({
  scaffoldProject: mockScaffoldProject,
}));

vi.mock("#scaffolding/typescript.js", () => ({
  scaffoldProject: mockScaffoldProject,
}));

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

  const emptyConfig = { templates: {}, settings: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
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

  it("should set up the new command correctly", () => {
    setupNewCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("new");
    expect(mockProgram.alias).toHaveBeenCalledWith("nw");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "new.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<language>",
      "new.project.language.argument",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "<projectName>",
      "new.project.name.argument",
    );
    expect(mockProgram.requiredOption).toHaveBeenCalledWith(
      "-t, --template <string>",
      "new.project.template.option.description",
    );
  });

  it("should scaffold a project using the specified template name", async () => {
    setupNewCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    const language = "javascript";
    const projectName = "react-project";
    const templateName = "react-app";
    const templateConfig =
      sampleConfig.templates?.javascript?.templates[templateName];
    const cmdOptions = { template: templateName };

    await actionFn(language, projectName, cmdOptions);

    expect(mockSpinner.start).toHaveBeenCalledOnce();
    expect(mockScaffoldProject).toHaveBeenCalledWith({
      projectName,
      templateConfig,
      packageManager: "yarn",
      cacheStrategy: "always-refresh",
    });
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      "new.project.success- options projectName:react-project",
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should scaffold a project using a template alias", async () => {
    setupNewCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    const language = "javascript";
    const projectName = "vue-project";
    const templateAlias = "vue";
    const templateConfig =
      sampleConfig.templates?.javascript?.templates["vue-alias"];
    const cmdOptions = { template: templateAlias };

    await actionFn(language, projectName, cmdOptions);

    expect(mockSpinner.start).toHaveBeenCalledOnce();
    expect(mockScaffoldProject).toHaveBeenCalledWith({
      projectName,
      templateConfig,
      packageManager: "npm",
      cacheStrategy: "daily",
    });
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      "new.project.success- options projectName:vue-project",
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if the language config is not found", async () => {
    setupNewCommand({
      program: mockProgram,
      config: emptyConfig,
      source: "local",
    });
    const language = "python";
    const projectName = "my-python-project";
    const cmdOptions = { template: "my-template" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        "error.language_config_not_found- options language:python",
      ),
      mockSpinner,
    );
  });

  it("should throw a DevkitError if the specified template is not found", async () => {
    setupNewCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    const language = "javascript";
    const projectName = "my-project";
    const cmdOptions = { template: "non-existent-template" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        "error.template.not_found- options template:non-existent-template",
      ),
      mockSpinner,
    );
  });

  it("should handle an error during the project scaffolding process", async () => {
    const mockError = new Error("Scaffolding failed");
    mockScaffoldProject.mockRejectedValue(mockError);

    setupNewCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    const language = "javascript";
    const projectName = "my-project";
    const cmdOptions = { template: "react-app" };

    await actionFn(language, projectName, cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
