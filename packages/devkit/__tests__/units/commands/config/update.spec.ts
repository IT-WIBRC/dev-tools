import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupUpdateCommand } from "../../../../src/commands/config/update.js";
import { mockSpinner, mockChalk, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const { mockHandleErrorAndExit, mockHandleNonInteractiveTemplateUpdate } =
  vi.hoisted(() => ({
    mockHandleErrorAndExit: vi.fn(),
    mockHandleNonInteractiveTemplateUpdate: vi.fn(),
  }));

let actionFn: any;

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveTemplateUpdate: mockHandleNonInteractiveTemplateUpdate,
}));

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
const mockProcessExit = vi
  .spyOn(process, "exit")
  .mockImplementation((() => {}) as unknown as never);

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
      mocktFn("config.update.command.description"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-n, --new-name <string>",
      mocktFn("config.update.option.new_name"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-d, --description <string>",
      mocktFn("config.update.option.description"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-a, --alias <string>",
      mocktFn("config.update.option.alias"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-l, --location <string>",
      mocktFn("config.update.option.location"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "--cache-strategy <string>",
      mocktFn("config.update.option.cache_strategy"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "--package-manager <string>",
      mocktFn("config.update.option.package_manager"),
    );
    expect(mockConfigCommand.option).toHaveBeenCalledWith(
      "-g, --global",
      mocktFn("config.update.option.global"),
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
      await actionFn("javascript", ["my-template"], defaultCmdOptions);

      expect(mockSpinner.start).toHaveBeenCalledWith(
        mockChalk.cyan(
          mocktFn("config.update.updating", { templateName: "my-template" }),
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
        mockChalk.green(
          `\n✔ ${mocktFn("config.update.success_summary", {
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
      await actionFn("javascript", ["temp1", "temp2"], defaultCmdOptions);

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(2);
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp1",
        expect.any(Object),
        false,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledWith(
        "javascript",
        "temp2",
        expect.any(Object),
        false,
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.green(
          `\n✔ ${mocktFn("config.update.success_summary", {
            count: "2",
            templateName: "temp1, temp2",
            language: "javascript",
          })}`,
        ),
      );
    });

    it("should handle mixed success and failure and exit with code 1", async () => {
      mockHandleNonInteractiveTemplateUpdate
        .mockResolvedValue(undefined)
        .mockRejectedValue(
          new DevkitError(
            mocktFn("error.template.not_found", { template: "temp2" }),
          ),
        )
        .mockResolvedValueOnce(undefined);

      setupUpdateCommand(mockConfigCommand);
      await actionFn(
        "javascript",
        ["temp1", "temp2", "temp3"],
        defaultCmdOptions,
      );

      expect(mockHandleNonInteractiveTemplateUpdate).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow(
          `\n${mocktFn("config.update.single_fail", {
            templateName: "temp2",
            error: mocktFn("error.template.not_found", { template: "temp2" }),
          })}`,
        ),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("config.update.success_summary"),
      );
      expect(mockProcessExit).toHaveBeenCalledOnce();
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it("should handle an invalid template name", async () => {
      setupUpdateCommand(mockConfigCommand);

      await actionFn("javascript", [], defaultCmdOptions);

      expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
        new DevkitError(mocktFn("error.template_name_required")),
        mockSpinner,
      );
      expect(mockHandleNonInteractiveTemplateUpdate).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      const mockError = new Error("Unexpected error");
      mockHandleNonInteractiveTemplateUpdate.mockRejectedValue(mockError);

      setupUpdateCommand(mockConfigCommand);
      await actionFn("javascript", ["my-template"], defaultCmdOptions);

      expect(mockSpinner.stop).toHaveBeenCalled();
      expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        mockChalk.yellow(
          `\n${mocktFn("config.update.single_fail", {
            templateName: "my-template",
            error: "unknown error",
          })}`,
        ),
      );
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});
