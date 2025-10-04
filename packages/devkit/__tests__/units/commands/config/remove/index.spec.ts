import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupRemoveCommand } from "../../../../../src/commands/config/remove/index.js";
import {
  mockSpinner,
  mockLogger,
  mocktFn,
} from "../../../../../vitest.setup.js";
import { DevkitError } from "../../../../../src/utils/errors/base.js";
import type { CliConfig } from "../../../../../src/utils/schema/schema.js";

const {
  mockHandleErrorAndExit,
  mockGetTemplateNamesToActOn,
  mockSaveConfig,
  mockMapLanguageAliasToCanonicalKey,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockGetTemplateNamesToActOn: vi.fn(),
  mockSaveConfig: vi.fn(),
  mockMapLanguageAliasToCanonicalKey: vi.fn((lang) => lang),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#core/config/language.js", () => ({
  mapLanguageAliasToCanonicalKey: mockMapLanguageAliasToCanonicalKey,
}));

vi.mock("../../../../../src/commands/config/remove/logic.js", () => ({
  getTemplateNamesToActOn: mockGetTemplateNamesToActOn,
  saveConfig: mockSaveConfig,
}));

const CMD_DESCRIPTION_KEY = "commands.template.remove.command.description";
const STATUS_REMOVING_KEY = "messages.status.template_removing";
const SUCCESS_REMOVED_KEY = "messages.success.template_removed";
const WARNING_NOT_FOUND_KEY = "warnings.template.list_not_found";
const ERROR_TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const ERROR_VALIDATION_REQUIRED_KEY =
  "errors.validation.template_name_required";

const MOCK_LANGUAGE_TEMPLATES = {
  "vue-basic": {
    description: "A basic Vue template",
    location: "https://github.com/vuejs/vue",
    alias: "vb",
  },
  "react-basic": {
    description: "A basic React template",
    location: "https://github.com/facebook/react",
  },
};

const MOCK_TARGET_CONFIG: CliConfig = {
  settings: {} as CliConfig["settings"],
  templates: {
    javascript: {
      templates: MOCK_LANGUAGE_TEMPLATES,
    },
    typescript: {
      templates: {},
    },
  },
};

const callAction = (
  language: string,
  templateNames: string[],
  isGlobal: boolean,
) => {
  const parentOpts = { global: isGlobal };
  return actionFn(
    language,
    templateNames,
    {},
    {
      parent: {
        opts: vi.fn(() => parentOpts),
      },
    },
  );
};

describe("setupRemoveCommand (Command Handler)", () => {
  let mockConfigCommand: any;

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockConfigCommand = {
      command: vi.fn(() => mockConfigCommand),
      description: vi.fn(() => mockConfigCommand),
      option: vi.fn(() => mockConfigCommand),
      alias: vi.fn(() => mockConfigCommand),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockConfigCommand;
      }),
    };
    mockMapLanguageAliasToCanonicalKey.mockImplementation((lang) => lang);
  });

  it("should set up the remove command with correct options and arguments", () => {
    setupRemoveCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "remove <language> <templateName...>",
    );
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("rm");
    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      mocktFn(CMD_DESCRIPTION_KEY),
    );
  });

  it("should map language alias ('js') to canonical key and pass it to logic", async () => {
    const aliasLang = "js";
    const canonicalLang = "javascript";
    const templateToRemove = "vue-basic";

    mockMapLanguageAliasToCanonicalKey.mockReturnValueOnce(canonicalLang);
    mockGetTemplateNamesToActOn.mockResolvedValueOnce({
      targetConfig: structuredClone(MOCK_TARGET_CONFIG),
      languageTemplates: structuredClone(MOCK_LANGUAGE_TEMPLATES),
      templatesToActOn: [templateToRemove],
      notFound: [],
    });
    mockSaveConfig.mockResolvedValue(undefined);

    setupRemoveCommand(mockConfigCommand);
    await callAction(aliasLang, [templateToRemove], false);

    expect(mockMapLanguageAliasToCanonicalKey).toHaveBeenCalledWith(aliasLang);

    expect(mockGetTemplateNamesToActOn).toHaveBeenCalledWith(
      canonicalLang,
      [templateToRemove],
      false,
    );

    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mocktFn(SUCCESS_REMOVED_KEY, {
        count: "1",
        templateName: templateToRemove,
        language: canonicalLang,
      }),
    );

    const savedConfig = mockSaveConfig.mock.calls[0]![0];
    expect(
      savedConfig.templates[canonicalLang].templates[templateToRemove],
    ).toBeUndefined();
    expect(savedConfig.templates[aliasLang]).toBeUndefined();
  });

  describe("action handler", () => {
    it("should remove one template and save to local config (success case)", async () => {
      const templateToRemove = "vue-basic";
      const language = "javascript";

      mockGetTemplateNamesToActOn.mockResolvedValue({
        targetConfig: structuredClone(MOCK_TARGET_CONFIG),
        languageTemplates: structuredClone(MOCK_LANGUAGE_TEMPLATES),
        templatesToActOn: [templateToRemove],
        notFound: [],
      });
      mockSaveConfig.mockResolvedValue(undefined);

      setupRemoveCommand(mockConfigCommand);
      await callAction(language, [templateToRemove], false);

      expect(mockGetTemplateNamesToActOn).toHaveBeenCalledWith(
        language,
        [templateToRemove],
        false,
      );

      expect(mockSaveConfig).toHaveBeenCalledOnce();
      const savedConfig = mockSaveConfig.mock.calls[0]![0];

      expect(
        savedConfig.templates[language].templates[templateToRemove],
      ).toBeUndefined();
      expect(
        savedConfig.templates[language].templates["react-basic"],
      ).toBeDefined();

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(mocktFn(STATUS_REMOVING_KEY)),
      );
      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: templateToRemove,
          language: language,
        }),
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should remove multiple templates and save to global config", async () => {
      const templates = ["vue-basic", "react-basic"];
      const language = "javascript";

      mockGetTemplateNamesToActOn.mockResolvedValue({
        targetConfig: structuredClone(MOCK_TARGET_CONFIG),
        languageTemplates: structuredClone(MOCK_LANGUAGE_TEMPLATES),
        templatesToActOn: templates,
        notFound: [],
      });
      mockSaveConfig.mockResolvedValue(undefined);

      setupRemoveCommand(mockConfigCommand);
      await callAction(language, templates, true);

      expect(mockGetTemplateNamesToActOn).toHaveBeenCalledWith(
        language,
        templates,
        true,
      );
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ templates: expect.any(Object) }),
        true,
      );

      const savedConfig = mockSaveConfig.mock.calls[0]![0];
      expect(savedConfig.templates[language].templates).toEqual({});

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "2",
          templateName: templates.join(", "),
          language: language,
        }),
      );
      expect(mockLogger.warning).not.toHaveBeenCalled();
    });

    it("should remove existing templates and log a warning for notFound templates", async () => {
      const existingTemplate = "vue-basic";
      const missingTemplate = "non-existent";
      const language = "javascript";

      mockGetTemplateNamesToActOn.mockResolvedValue({
        targetConfig: structuredClone(MOCK_TARGET_CONFIG),
        languageTemplates: structuredClone(MOCK_LANGUAGE_TEMPLATES),
        templatesToActOn: [existingTemplate],
        notFound: [missingTemplate],
      });
      mockSaveConfig.mockResolvedValue(undefined);

      setupRemoveCommand(mockConfigCommand);
      await callAction(language, [existingTemplate, missingTemplate], false);

      expect(mockSaveConfig).toHaveBeenCalledOnce();

      expect(mockSpinner.succeed).toHaveBeenCalledWith(
        mocktFn(SUCCESS_REMOVED_KEY, {
          count: "1",
          templateName: existingTemplate,
          language: language,
        }),
      );

      expect(mockLogger.warning).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(WARNING_NOT_FOUND_KEY, {
            templates: missingTemplate,
          }),
        ),
      );
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });

    it("should throw DevkitError if no template names are provided", async () => {
      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", [], false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn(ERROR_VALIDATION_REQUIRED_KEY)),
        mockSpinner,
      );
      expect(mockGetTemplateNamesToActOn).not.toHaveBeenCalled();
    });

    it("should throw DevkitError if getTemplateNamesToActOn returns zero templatesToActOn", async () => {
      const missingTemplates = ["non-existent-1", "non-existent-2"];

      mockGetTemplateNamesToActOn.mockResolvedValue({
        targetConfig: structuredClone(MOCK_TARGET_CONFIG),
        languageTemplates: structuredClone(MOCK_LANGUAGE_TEMPLATES),
        templatesToActOn: [],
        notFound: missingTemplates,
      });

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", missingTemplates, false);

      const expectedError = new DevkitError(
        mocktFn(ERROR_TEMPLATE_NOT_FOUND_KEY, {
          template: missingTemplates.join(", "),
        }),
      );

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        expectedError,
        mockSpinner,
      );
      expect(mockSaveConfig).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors from getTemplateNamesToActOn gracefully", async () => {
      const mockError = new Error("Config read failed during resolution");
      mockGetTemplateNamesToActOn.mockRejectedValue(mockError);

      setupRemoveCommand(mockConfigCommand);
      await callAction("javascript", ["vue-basic"], false);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
      expect(mockSaveConfig).not.toHaveBeenCalled();
    });
  });
});
