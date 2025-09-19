import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupAddTemplateCommand } from "../../../../src/commands/add-template/index.js";
import {
  PackageManagers,
  ProgrammingLanguage,
  VALID_CACHE_STRATEGIES,
} from "../../../integrations/common.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base";

const {
  mockGetConfig,
  mockPromptForTemplateDetails,
  mockValidateAndSaveTemplate,
  mockHandleErrorAndExit,
} = vi.hoisted(() => ({
  mockGetConfig: vi.fn(),
  mockPromptForTemplateDetails: vi.fn(),
  mockValidateAndSaveTemplate: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

vi.mock("../../../../src/commands/add-template/get-config.js", () => ({
  getConfig: mockGetConfig,
}));

vi.mock("../../../../src/commands/add-template/prompt-details.js", () => ({
  promptForTemplateDetails: mockPromptForTemplateDetails,
}));

vi.mock("../../../../src/commands/add-template/validate-and-save.js", () => ({
  validateAndSaveTemplate: mockValidateAndSaveTemplate,
}));

vi.mock("../../../../src/utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

const initialConfig = {
  templates: {
    [ProgrammingLanguage.Javascript.toLowerCase()]: {
      templates: {
        "vue-basic": {
          description: "A basic Vue template",
          location: "https://github.com/vuejs/vue",
          alias: "vb",
        },
      },
    },
  },
};

const globalProgramConfig = {
  templates: {
    [ProgrammingLanguage.Javascript.toLowerCase()]: {
      templates: {},
    },
  },
};

describe("setupAddTemplateCommand", () => {
  let mockProgram: any;
  let actionFn: (options: any) => Promise<void>;
  const jsLang = ProgrammingLanguage.Javascript.toLowerCase();

  beforeEach(() => {
    vi.clearAllMocks();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });
  });

  it("should set up the add-template command with all options", () => {
    expect(mockProgram.command).toHaveBeenCalledWith("add-template");
    expect(mockProgram.alias).toHaveBeenCalledWith("at");
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-g, --global",
      expect.any(String),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-i, --interactive",
      expect.any(String),
      false,
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-l, --language <language>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-n, --name <name>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-d, --description <description>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-o, --location <location>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-a, --alias <alias>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-c, --cache-strategy <strategy>",
      expect.any(String),
    );
    expect(mockProgram.option).toHaveBeenCalledWith(
      "-p, --package-manager <manager>",
      expect.any(String),
    );
  });

  it("should use CLI options and bypass prompts if all required options are provided", async () => {
    mockGetConfig.mockResolvedValueOnce(initialConfig);
    const cmdOptions = {
      global: false,
      interactive: false,
      language: jsLang,
      name: "react-app-cli",
      description: "A React template via CLI options",
      location: "https://github.com/facebook/react.git",
      alias: "rac",
      cacheStrategy: VALID_CACHE_STRATEGIES[0],
      packageManager: PackageManagers.Bun,
    };
    await actionFn(cmdOptions);

    const expectedDetails = {
      language: jsLang,
      templateName: "react-app-cli",
      description: "A React template via CLI options",
      location: "https://github.com/facebook/react.git",
      alias: "rac",
      cacheStrategy: VALID_CACHE_STRATEGIES[0],
      packageManager: PackageManagers.Bun,
    };

    expect(mockGetConfig).toHaveBeenCalledWith(false, "local", initialConfig);
    expect(mockPromptForTemplateDetails).not.toHaveBeenCalled();
    expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
      expectedDetails,
      initialConfig,
      false,
      expect.any(Object),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should enter interactive mode and call promptForTemplateDetails when no options are provided", async () => {
    mockGetConfig.mockResolvedValueOnce(initialConfig);
    const mockTemplateDetails = {
      language: jsLang,
      templateName: "new-template",
      description: "A new template",
      location: "http://example.com/new",
      alias: "nt",
      cacheStrategy: VALID_CACHE_STRATEGIES[0],
      packageManager: PackageManagers.Npm,
    };
    mockPromptForTemplateDetails.mockResolvedValueOnce(mockTemplateDetails);

    const cmdOptions = { interactive: true };
    await actionFn(cmdOptions);

    expect(mockGetConfig).toHaveBeenCalledWith(false, "local", initialConfig);
    expect(mockPromptForTemplateDetails).toHaveBeenCalledWith(
      initialConfig,
      cmdOptions,
    );
    expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
      mockTemplateDetails,
      initialConfig,
      false,
      expect.any(Object),
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should add a new template to the global configuration with --global flag", async () => {
    mockGetConfig.mockResolvedValueOnce(globalProgramConfig);
    const cmdOptions = {
      global: true,
      interactive: false,
      language: jsLang,
      name: "new-global",
      description: "A new global template",
      location: "http://example.com/global",
    };

    await actionFn(cmdOptions);
    const expectedDetails = {
      language: jsLang,
      templateName: "new-global",
      description: "A new global template",
      location: "http://example.com/global",
      alias: undefined,
      cacheStrategy: undefined,
      packageManager: undefined,
    };

    expect(mockGetConfig).toHaveBeenCalledWith(true, "local", initialConfig);
    expect(mockValidateAndSaveTemplate).toHaveBeenCalledWith(
      expectedDetails,
      globalProgramConfig,
      true,
      expect.any(Object),
    );
  });

  it("should throw DevkitError if a required option is missing in non-interactive mode", async () => {
    const cmdOptions = {
      global: false,
      interactive: false,
      language: jsLang,
      name: "incomplete-template",
      description: "Missing location",
      location: undefined,
    };

    await actionFn(cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        mocktFn("error.missing_required_options.add_template", {
          fields: ["--language", "--name", "--description", "--location"].join(
            ", ",
          ),
        }),
      ),
      mockSpinner,
    );
    expect(mockValidateAndSaveTemplate).not.toHaveBeenCalled();
  });

  it("should call handleErrorAndExit if an error is thrown during getConfig", async () => {
    const mockError = new DevkitError(mocktFn("error.config.global.not.found"));
    mockGetConfig.mockRejectedValueOnce(mockError);

    await actionFn({ global: true });

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
    expect(mockValidateAndSaveTemplate).not.toHaveBeenCalled();
  });

  it("should call handleErrorAndExit if an error is thrown during promptForTemplateDetails", async () => {
    const mockError = new DevkitError(mocktFn("error.template.exists"));
    mockGetConfig.mockResolvedValueOnce(initialConfig);
    mockPromptForTemplateDetails.mockRejectedValueOnce(mockError);

    const cmdOptions = { interactive: true };
    await actionFn(cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
    expect(mockValidateAndSaveTemplate).not.toHaveBeenCalled();
  });

  it("should call handleErrorAndExit if an error is thrown during validateAndSaveTemplate", async () => {
    const mockError = new DevkitError(
      mocktFn("error.template.invalid_details"),
    );
    mockGetConfig.mockResolvedValueOnce(initialConfig);
    mockValidateAndSaveTemplate.mockRejectedValueOnce(mockError);

    const cmdOptions = {
      language: jsLang,
      name: "new-template",
      description: "test",
      location: "test",
    };
    await actionFn(cmdOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
