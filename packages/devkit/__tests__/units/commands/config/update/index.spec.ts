import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupUpdateCommand } from "../../../../../src/commands/config/update/index.js";
import {
  mockSpinner,
  mocktFn,
  mockLogger,
} from "../../../../../vitest.setup.js";
import { DevkitError } from "../../../../../src/utils/errors/base.js";

const {
  mockHandleErrorAndExit,
  mockHandleNonInteractiveTemplateUpdate,
  mockResolveTemplateNamesForUpdate,
  mockValidateProgrammingLanguage,
  mockMapLanguageAliasToCanonicalKey,
} = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
  mockHandleNonInteractiveTemplateUpdate: vi.fn(),
  mockResolveTemplateNamesForUpdate: vi.fn(),
  mockValidateProgrammingLanguage: vi.fn(),
  mockMapLanguageAliasToCanonicalKey: vi.fn((lang) => lang),
}));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("#utils/validations/config.js", () => ({
  validateProgrammingLanguage: mockValidateProgrammingLanguage,
}));

vi.mock("#core/config/language.js", () => ({
  mapLanguageAliasToCanonicalKey: mockMapLanguageAliasToCanonicalKey,
}));

vi.mock("../../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveTemplateUpdate: mockHandleNonInteractiveTemplateUpdate,
}));

vi.mock("../../../../../src/commands/config/update/logic.js", () => ({
  resolveTemplateNamesForUpdate: mockResolveTemplateNamesForUpdate,
}));

const consoleLogSpy = mockLogger.log;
const mockProcessExit = vi
  .spyOn(process, "exit")
  .mockImplementation((() => {}) as unknown as never);

const OPT_NEW_NAME_KEY = "commands.config.update_template.options.new_name";
const OPT_DESCRIPTION_KEY =
  "commands.config.update_template.options.description";
const OPT_ALIAS_KEY = "commands.config.update_template.options.alias";
const OPT_LOCATION_KEY = "commands.config.update_template.options.location";
const OPT_CACHE_STRATEGY_KEY =
  "commands.config.update_template.options.cache_strategy";
const OPT_PACKAGE_MANAGER_KEY =
  "commands.config.update_template.options.package_manager";
const OPT_GLOBAL_KEY = "commands.config.update_template.options.global";
const VALIDATION_REQUIRED_KEY = "errors.validation.template_name_required";
const TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const SINGLE_FAIL_KEY = "errors.template.single_fail";
const SUCCESS_SUMMARY_KEY = "messages.success.template_summary_updated";
const WARNING_NOT_FOUND_KEY = "warnings.template.list_not_found";

describe("setupUpdateCommand", () => {
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
    mockProcessExit.mockClear();
    mockValidateProgrammingLanguage.mockReturnValue(true);
    mockMapLanguageAliasToCanonicalKey.mockImplementation((lang) => lang);
  });

  it("should set up the update command with correct options and arguments", () => {
    setupUpdateCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "update <language> <templateName...>",
    );
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("up");

    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-n, --new-name <string>",
      mocktFn(OPT_NEW_NAME_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-d, --description <string>",
      mocktFn(OPT_DESCRIPTION_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-a, --alias <string>",
      mocktFn(OPT_ALIAS_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-l, --location <string>",
      mocktFn(OPT_LOCATION_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "--cache-strategy <string>",
      mocktFn(OPT_CACHE_STRATEGY_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "--package-manager <string>",
      mocktFn(OPT_PACKAGE_MANAGER_KEY),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn(OPT_GLOBAL_KEY),
      false,
    );
  });

  it("should map a language alias ('ts') to its canonical key and use it for update logic", async () => {
    const aliasLang = "ts";
    const canonicalLang = "typescript";
    const templateName = "my-template-actual";

    mockMapLanguageAliasToCanonicalKey.mockReturnValueOnce(canonicalLang);
    mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
      resolvedNames: [templateName],
      notFoundNames: [],
    });
    mockHandleNonInteractiveTemplateUpdate.mockResolvedValueOnce(undefined);

    const defaultCmdOptions = {
      description: "Updated description",
      location: "http://updated.com",
      newName: "new-name",
      global: false,
    };
    const parentOpts = { parent: { opts: () => ({ global: false }) } };

    setupUpdateCommand(mockConfigCommand);
    await actionFn(aliasLang, [templateName], defaultCmdOptions, parentOpts);

    expect(mockMapLanguageAliasToCanonicalKey).toHaveBeenCalledOnce();
    expect(mockMapLanguageAliasToCanonicalKey).toHaveBeenCalledWith(aliasLang);

    expect(mockValidateProgrammingLanguage).toHaveBeenCalledOnce();
    expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(canonicalLang);
    expect(mockResolveTemplateNamesForUpdate).toHaveBeenCalledOnce();
    expect(mockResolveTemplateNamesForUpdate).toHaveBeenCalledWith(
      canonicalLang,
      [templateName],
      false,
    );

    expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledOnce();
    expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
      canonicalLang,
      templateName,
      {
        ...defaultCmdOptions,
        language: "ts",
      },
      false,
    );
  });

  describe("action handler - Success and Wildcard", () => {
    const defaultCmdOptions = {
      description: "Updated description",
      location: "http://updated.com",
      newName: "new-name",
      global: false,
    };
    const parentOpts = { parent: { opts: () => ({ global: false }) } };

    it("should update a single template (resolved name) and print a success message", async () => {
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: ["my-template-actual"],
        notFoundNames: [],
      });
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValueOnce(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["my-alias"], defaultCmdOptions, parentOpts);

      expect(mockValidateProgrammingLanguage).toHaveBeenCalledWith(
        "javascript",
      );
      expect(mockResolveTemplateNamesForUpdate).toHaveBeenCalledWith(
        "javascript",
        ["my-alias"],
        false,
      );

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "my-template-actual",
        {
          ...defaultCmdOptions,
          language: "javascript",
        },
        false,
      );
      expect(mockSpinner.stop).toHaveBeenCalled();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          `\n✔ ${mocktFn(SUCCESS_SUMMARY_KEY, {
            count: "1",
            templateName: "my-template-actual",
            language: "javascript",
          })}`,
        ),
      );
      expect(mockLogger.warning).not.toHaveBeenCalled();
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it("should update multiple templates and print a summary", async () => {
      const templateList = ["temp1", "temp2"];
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: templateList,
        notFoundNames: [],
      });
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValue(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", templateList, defaultCmdOptions, parentOpts);

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp1",
        {
          language: "javascript",
          global: false,
          description: "Updated description",
          location: "http://updated.com",
          newName: "new-name",
        },
        false,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp2",
        {
          language: "javascript",
          global: false,
          description: "Updated description",
          location: "http://updated.com",
          newName: "new-name",
        },
        false,
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          `\n✔ ${mocktFn(SUCCESS_SUMMARY_KEY, {
            count: "2",
            templateName: "temp1, temp2",
            language: "javascript",
          })}`,
        ),
      );
      expect(mockLogger.warning).not.toHaveBeenCalled();
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it("should update ALL templates using the wildcard '*' and print success", async () => {
      const allTemplates = ["tempA", "tempB", "tempC"];
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: allTemplates,
        notFoundNames: [],
      });
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValue(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["*"], defaultCmdOptions, parentOpts);

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          `\n✔ ${mocktFn(SUCCESS_SUMMARY_KEY, {
            count: "3",
            templateName: "tempA, tempB, tempC",
            language: "javascript",
          })}`,
        ),
      );
      expect(mockLogger.warning).not.toHaveBeenCalled();
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it("should update templates (wildcard) and display warning for explicitly listed missing names", async () => {
      const allTemplates = ["tempA", "tempB"];
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: allTemplates,
        notFoundNames: ["missing-1", "missing-2"],
      });
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValue(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        ["*", "missing-1", "missing-2"],
        defaultCmdOptions,
        parentOpts,
      );

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          expect.stringContaining(
            mocktFn(SUCCESS_SUMMARY_KEY, {
              count: "2",
              templateName: "tempA, tempB",
              language: "javascript",
            }),
          ),
        ),
      );
      expect(mockLogger.warning).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          mocktFn(WARNING_NOT_FOUND_KEY, {
            templates: "missing-1, missing-2",
          }),
        ),
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
    });
  });

  describe("action handler - Failure and Edge Cases", () => {
    const defaultCmdOptions = {
      description: "Updated description",
      location: "http://updated.com",
      newName: "new-name",
      global: false,
    };
    const parentOpts = { parent: { opts: () => ({ global: false }) } };

    it("should handle mixed success and failure and exit with code 1", async () => {
      const templatesToActOn = ["temp1", "temp2", "temp3"];
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: templatesToActOn,
        notFoundNames: [],
      });

      const devkitErrorInstance = new DevkitError(
        mocktFn(TEMPLATE_NOT_FOUND_KEY, { template: "temp2" }),
      );

      mockHandleNonInteractiveTemplateUpdate
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(devkitErrorInstance)
        .mockResolvedValueOnce(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        templatesToActOn,
        defaultCmdOptions,
        parentOpts,
      );

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(3);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          `\n${mocktFn(SINGLE_FAIL_KEY, {
            templateName: "temp2",
            error: mocktFn(TEMPLATE_NOT_FOUND_KEY, { template: "temp2" }),
          })}`,
        ),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          `\n✔ ${mocktFn(SUCCESS_SUMMARY_KEY, {
            count: "2",
            templateName: "temp1, temp2, temp3",
            language: "javascript",
          })}`,
        ),
      );

      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("should handle an invalid language (validation failure)", async () => {
      const mockError = new DevkitError("Invalid language provided");
      mockValidateProgrammingLanguage.mockImplementation(() => {
        throw mockError;
      });

      setupUpdateCommand(mockConfigCommand);
      await actionFn("invalid-lang", ["my-template"], defaultCmdOptions, {
        parent: { opts: () => ({ global: false }) },
      });

      expect(mockResolveTemplateNamesForUpdate).not.toHaveBeenCalled();
      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        mockError,
        mockSpinner,
      );
    });

    it("should throw an error if no templates are found to act on after resolution", async () => {
      const missingTemplates = ["missing-1", "missing-2"];
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: [],
        notFoundNames: missingTemplates,
      });

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        missingTemplates,
        defaultCmdOptions,
        parentOpts,
      );

      const expectedError = new DevkitError(
        mocktFn(TEMPLATE_NOT_FOUND_KEY, {
          template: missingTemplates.join(", "),
        }),
      );

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        expectedError,
        mockSpinner,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).not.toHaveBeenCalled();
    });

    it("should handle an invalid template name (empty array to action)", async () => {
      setupUpdateCommand(mockConfigCommand);

      await actionFn("javascript", [], defaultCmdOptions, parentOpts);

      const expectedError = new DevkitError(mocktFn(VALIDATION_REQUIRED_KEY));

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        expectedError,
        mockSpinner,
      );
      expect(mockResolveTemplateNamesForUpdate).not.toHaveBeenCalled();
      expect(mockHandleNonInteractiveTemplateUpdate).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors during template update gracefully", async () => {
      const templateName = "my-template";
      const mockError = new Error("Unexpected error");
      mockResolveTemplateNamesForUpdate.mockResolvedValueOnce({
        resolvedNames: [templateName],
        notFoundNames: [],
      });
      mockHandleNonInteractiveTemplateUpdate.mockRejectedValueOnce(mockError);

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        [templateName],
        defaultCmdOptions,
        parentOpts,
      );

      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          `\n${mocktFn(SINGLE_FAIL_KEY, {
            templateName,
            error: "unknown error",
          })}`,
        ),
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
    });
  });
});
