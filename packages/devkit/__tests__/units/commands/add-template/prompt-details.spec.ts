import { vi, describe, it, expect, beforeEach } from "vitest";
import { mocktFn } from "../../../../vitest.setup.js";
import {
  ProgrammingLanguage,
  type CliConfig,
  VALID_CACHE_STRATEGIES,
  PackageManagers,
} from "../../../../src/utils/configs/schema.js";
import { promptForTemplateDetails } from "../../../../src/commands/add-template/prompt-details.js";
import type { AddTemplateCommandOptions } from "../../../../src/commands/add-template/types.js";

const {
  mockInquirerInput,
  mockInquirerSelect,
  mockChalk,
  mockValidateAlias,
  mockValidateDescription,
} = vi.hoisted(() => ({
  mockInquirerInput: vi.fn(),
  mockInquirerSelect: vi.fn(),
  mockChalk: {
    red: vi.fn((s) => s),
    gray: vi.fn((s) => s),
  },
  mockValidateAlias: vi.fn(),
  mockValidateDescription: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
  input: mockInquirerInput,
  select: mockInquirerSelect,
}));

vi.mock("chalk", () => ({
  default: mockChalk,
}));

vi.mock("#utils/validations/templates.js", () => ({
  validateAlias: mockValidateAlias,
  validateDescription: mockValidateDescription,
}));

const jsLang = ProgrammingLanguage.Javascript.toLowerCase();

const mockConfig: CliConfig = {
  templates: {
    [jsLang]: {
      templates: {
        "existing-template": {
          description: "An existing template",
          location: "http://example.com/existing",
          alias: "ext",
        },
      },
    },
  },
} as unknown as CliConfig;

describe("promptForTemplateDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateAlias.mockImplementation(() => {});
    mockValidateDescription.mockImplementation(() => {});

    mockInquirerSelect.mockResolvedValue(jsLang);
    mockInquirerInput.mockResolvedValue("mocked-value");
  });

  it("should return correct details when all prompts are filled interactively", async () => {
    mockInquirerSelect.mockResolvedValueOnce(jsLang);
    mockInquirerInput.mockResolvedValueOnce("new-template");
    mockInquirerInput.mockResolvedValueOnce("A new template");
    mockInquirerInput.mockResolvedValueOnce("http://example.com/new");
    mockInquirerInput.mockResolvedValueOnce("nt");
    mockInquirerSelect.mockResolvedValueOnce("network-first");
    mockInquirerSelect.mockResolvedValueOnce("npm");

    const result = await promptForTemplateDetails(
      mockConfig,
      {} as AddTemplateCommandOptions,
    );

    expect(mockInquirerSelect).toHaveBeenCalledTimes(3);
    expect(mockInquirerInput).toHaveBeenCalledTimes(4);

    expect(result).toEqual({
      language: jsLang,
      templateName: "new-template",
      description: "A new template",
      location: "http://example.com/new",
      alias: "nt",
      cacheStrategy: "network-first",
      packageManager: "npm",
    });
  });

  it("should use and pre-fill CLI options when provided", async () => {
    const cmdOptions: AddTemplateCommandOptions = {
      language: jsLang,
      name: "cli-template",
      description: "A template from CLI",
      location: "http://example.com/cli",
      alias: "ct",
      cacheStrategy: VALID_CACHE_STRATEGIES[0],
      packageManager: PackageManagers.Yarn,
      global: false,
      interactive: false,
    };

    mockInquirerSelect.mockImplementation((opts) => opts.default);
    mockInquirerInput.mockImplementation((opts) => opts.default);

    const result = await promptForTemplateDetails(mockConfig, cmdOptions);

    expect(mockInquirerSelect).toHaveBeenCalledTimes(3);
    expect(mockInquirerInput).toHaveBeenCalledTimes(4);

    expect(result).toEqual({
      language: jsLang,
      templateName: "cli-template",
      description: "A template from CLI",
      location: "http://example.com/cli",
      alias: "ct",
      cacheStrategy: VALID_CACHE_STRATEGIES[0],
      packageManager: PackageManagers.Yarn,
    });
  });

  it("should pre-fill some prompts and run the rest interactively", async () => {
    const cmdOptions = {
      language: jsLang,
      name: "partial-cli-template",
    } as AddTemplateCommandOptions;

    mockInquirerSelect.mockResolvedValueOnce(cmdOptions.language);
    mockInquirerInput.mockResolvedValueOnce(cmdOptions.name);
    mockInquirerInput.mockResolvedValueOnce("Partial template");
    mockInquirerInput.mockResolvedValueOnce("http://example.com/partial");
    mockInquirerInput.mockResolvedValueOnce("pt");
    mockInquirerSelect.mockResolvedValueOnce(null);
    mockInquirerSelect.mockResolvedValueOnce("npm");

    const result = await promptForTemplateDetails(mockConfig, cmdOptions);

    expect(mockInquirerSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: mocktFn("cli.add_template.prompts.language") + " (required)",
        default: cmdOptions.language,
      }),
    );
    expect(mockInquirerInput).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          mocktFn("cli.add_template.prompts.template_name") + " (required)",
        default: cmdOptions.name,
      }),
    );

    expect(result.templateName).toBe("partial-cli-template");
    expect(result.description).toBe("Partial template");
    expect(result.location).toBe("http://example.com/partial");
  });

  it("should validate that a template name does not already exist", async () => {
    const cmdOptions = {
      language: jsLang,
    } as AddTemplateCommandOptions;

    mockInquirerSelect.mockResolvedValueOnce(cmdOptions.language);

    await promptForTemplateDetails(mockConfig, cmdOptions);

    const namePromptOptions = mockInquirerInput?.mock?.calls[0]![0]!;
    const validateFn = namePromptOptions.validate;

    const existingName = "existing-template";
    const result = validateFn(existingName);
    expect(result).toBe(
      mocktFn("error.template.exists", { template: existingName }),
    );
  });
});
