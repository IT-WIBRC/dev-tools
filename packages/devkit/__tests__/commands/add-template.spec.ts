import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupAddTemplateCommand } from "../../src/commands/add-template.js";
import { mocktFn, mockSpinner } from "../../vitest.setup.js";

const {
  mockDeepmerge,
  mockGetConfigFilepath,
  mockReadConfigAtPath,
  mockSaveCliConfig,
  mockHandleErrorAndExit,
} = vi.hoisted(() => ({
  mockDeepmerge: vi.fn(),
  mockGetConfigFilepath: vi.fn(),
  mockReadConfigAtPath: vi.fn(),
  mockSaveCliConfig: vi.fn(),
  mockHandleErrorAndExit: vi.fn(),
}));

vi.mock("deepmerge", () => ({
  default: mockDeepmerge,
}));

vi.mock("#utils/configs/path-finder.js", () => ({
  getConfigFilepath: mockGetConfigFilepath,
}));

vi.mock("#utils/configs/reader.js", () => ({
  readConfigAtPath: mockReadConfigAtPath,
}));

vi.mock("#utils/configs/writer.js", () => ({
  saveCliConfig: mockSaveCliConfig,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

describe("setupAddTemplateCommand", () => {
  let mockProgram: any;
  let actionFn: any;

  const initialConfig = {
    templates: {
      javascript: {
        templates: {
          "vue-basic": {
            description: "A basic Vue template",
            location: "https://github.com/vuejs/vue",
          },
        },
      },
    },
  };

  const successConfig = {
    templates: {
      javascript: {
        templates: {},
      },
    },
  };

  const globalProgramConfig = {
    templates: {
      javascript: {
        templates: {},
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();

    mockProgram = {
      command: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      requiredOption: vi.fn(() => mockProgram),
      option: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the add-template command correctly", () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: {},
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith(
      "add-template <language> <templateName> <location>",
    );
    expect(mockProgram.description).toHaveBeenCalled();
    expect(mockProgram.alias).toHaveBeenCalledWith("at");
  });

  it("should add a new template to the local configuration successfully", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: successConfig,
      source: "local",
    });

    const newTemplate = {
      language: "javascript",
      templateName: "new-vue",
      location: "http://example.com/template",
    };
    const cmdOptions = {
      description: "A new template",
    };

    const mergedConfig = {
      ...successConfig,
      templates: {
        ...successConfig.templates,
      },
    };

    mockDeepmerge.mockReturnValue(mergedConfig);

    await actionFn(
      newTemplate.language,
      newTemplate.templateName,
      newTemplate.location,
      cmdOptions,
    );

    mergedConfig.templates.javascript.templates = {
      ...mergedConfig.templates.javascript.templates,
      [newTemplate.templateName]: {
        description: cmdOptions.description,
        location: newTemplate.location,
      },
    };
    expect(mockDeepmerge).toHaveBeenCalled();
    expect(mockSaveCliConfig).toHaveBeenCalledWith(mergedConfig, false);
    expect(mockSpinner.succeed).toHaveBeenCalled();
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw DevkitError if the template already exists in local config", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });

    const existingTemplate = {
      language: "javascript",
      templateName: "vue-basic",
      location: "https://github.com/vuejs/vue",
    };
    const cmdOptions = { description: "A test template" };

    mockDeepmerge.mockImplementationOnce((config, config2) => ({
      ...config,
      ...config2,
    }));
    await actionFn(
      existingTemplate.language,
      existingTemplate.templateName,
      existingTemplate.location,
      cmdOptions,
    );

    expect(mockHandleErrorAndExit).toHaveBeenCalled();
    expect(mocktFn).toHaveBeenCalledWith("error.template.exists", {
      template: "vue-basic",
    });
    expect(mockSaveCliConfig).not.toHaveBeenCalled();
  });

  it("should add a new template to the global configuration with --global flag", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });

    vi.mocked(mockGetConfigFilepath).mockResolvedValueOnce(
      "/path/to/global/config",
    );
    vi.mocked(mockReadConfigAtPath).mockResolvedValueOnce(globalProgramConfig);
    vi.mocked(mockDeepmerge).mockImplementation((_, obj2) => obj2);

    const newTemplate = {
      language: "javascript",
      templateName: "new-global",
      location: "http://example.com/global",
    };
    const cmdOptions = {
      description: "A new global template",
      global: true,
    };

    await actionFn(
      newTemplate.language,
      newTemplate.templateName,
      newTemplate.location,
      cmdOptions,
    );

    expect(mockGetConfigFilepath).toHaveBeenCalledWith(true);
    expect(mockReadConfigAtPath).toHaveBeenCalledWith("/path/to/global/config");
    expect(mockSaveCliConfig).toHaveBeenCalledWith(expect.any(Object), true);
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it("should throw DevkitError when --global is used but global config is not found", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });

    vi.mocked(mockGetConfigFilepath).mockResolvedValueOnce(
      "/path/to/global/config",
    );
    vi.mocked(mockReadConfigAtPath).mockResolvedValueOnce(null);

    await actionFn("js", "test", "loc", {
      global: true,
      description: "",
    });

    expect(mockHandleErrorAndExit).toHaveBeenCalled();
    expect(mocktFn).toHaveBeenCalledWith("error.config.global.not.found");
  });

  it("should throw DevkitError for invalid cache strategy", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });

    const invalidCacheOptions = {
      description: "",
      cacheStrategy: "invalid",
    };
    await actionFn("javascript", "test", "loc", invalidCacheOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalled();
    expect(mocktFn).toHaveBeenCalledWith(
      "error.invalid.cache_strategy",
      expect.any(Object),
    );
  });

  it("should throw DevkitError for invalid package manager", async () => {
    setupAddTemplateCommand({
      program: mockProgram,
      config: initialConfig,
      source: "local",
    });

    const invalidPmOptions = {
      description: "",
      packageManager: "invalid-pm",
    };
    await actionFn("javascript", "test", "loc", invalidPmOptions);

    expect(mockHandleErrorAndExit).toHaveBeenCalled();
    expect(mocktFn).toHaveBeenCalledWith(
      "error.invalid.package_manager",
      expect.any(Object),
    );
  });
});
