import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupUpdateCommand } from "../../../../src/commands/config/update.js";
import { mockSpinner, mocktFn, mockLogger } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const { mockHandleErrorAndExit, mockHandleNonInteractiveTemplateUpdate } =
  vi.hoisted(() => ({
    mockHandleErrorAndExit: vi.fn(),
    mockHandleNonInteractiveTemplateUpdate: vi.fn(),
  }));

let actionFn: (...options: unknown[]) => Promise<void>;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveTemplateUpdate: mockHandleNonInteractiveTemplateUpdate,
}));

const consoleLogSpy = mockLogger.log;
const mockProcessExit = vi
  .spyOn(process, "exit")
  .mockImplementation((() => {}) as unknown as never);

const CMD_DESCRIPTION_KEY =
  "commands.config.update_template.command.description";
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
const STATUS_UPDATING_KEY = "messages.status.template_updating";
const VALIDATION_REQUIRED_KEY = "errors.validation.template_name_required";
const TEMPLATE_NOT_FOUND_KEY = "errors.template.not_found";
const SINGLE_FAIL_KEY = "errors.template.single_fail";
const SUCCESS_SUMMARY_KEY = "messages.success.template_summary_updated";

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
  });

  it("should set up the update command with correct options and arguments", () => {
    setupUpdateCommand(mockConfigCommand);
    expect(mockConfigCommand.command).toHaveBeenCalledWith(
      "update <language> <templateName...>",
    );
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("up");

    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      mocktFn(CMD_DESCRIPTION_KEY),
    );
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

  describe("action handler", () => {
    const defaultCmdOptions = {
      description: "Updated description",
      location: "http://updated.com",
      newName: "new-name",
      global: false,
    };

    it("should update a single template and print a success message", async () => {
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValueOnce(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["my-template"], defaultCmdOptions, {
        parent: { opts: () => ({ global: false }) },
      });

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockLogger.colors.cyan(
          mocktFn(STATUS_UPDATING_KEY, { templateName: "my-template" }),
        ),
      );
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "my-template",
        {
          ...defaultCmdOptions,
          language: "javascript",
          isGlobal: false,
        },
        false,
      );
      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.green(
          `\n✔ ${mocktFn(SUCCESS_SUMMARY_KEY, {
            count: "1",
            templateName: "my-template",
            language: "javascript",
          })}`,
        ),
      );
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it("should update multiple templates and print a summary", async () => {
      mockHandleNonInteractiveTemplateUpdate.mockResolvedValue(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["temp1", "temp2"], defaultCmdOptions, {
        parent: { opts: () => ({ global: false }) },
      });

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp1",
        expect.objectContaining({ language: "javascript", isGlobal: false }),
        false,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp2",
        expect.objectContaining({ language: "javascript", isGlobal: false }),
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
    });

    it("should handle mixed success and failure and exit with code 1", async () => {
      mockHandleNonInteractiveTemplateUpdate
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(
          new DevkitError(
            mocktFn(TEMPLATE_NOT_FOUND_KEY, { template: "temp2" }),
          ),
        )
        .mockResolvedValueOnce(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        ["temp1", "temp2", "temp3"],
        defaultCmdOptions,
        { parent: { opts: () => ({ global: false }) } },
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
        expect.stringContaining(SUCCESS_SUMMARY_KEY),
      );
      expect(mockProcessExit).toHaveBeenCalledOnce();
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("should handle an invalid template name (empty array)", async () => {
      setupUpdateCommand(mockConfigCommand);

      await actionFn("javascript", [], defaultCmdOptions, {
        parent: { opts: () => ({ global: false }) },
      });

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn(VALIDATION_REQUIRED_KEY)),
        mockSpinner,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Unexpected error");
      mockHandleNonInteractiveTemplateUpdate.mockRejectedValueOnce(mockError);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["my-template"], defaultCmdOptions, {
        parent: { opts: () => ({ global: false }) },
      });

      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockLogger.colors.yellow(
          `\n${mocktFn(SINGLE_FAIL_KEY, {
            templateName: "my-template",
            error: "unknown error",
          })}`,
        ),
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});
