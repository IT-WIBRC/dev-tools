import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupListCommand } from "../../../src/commands/list.js";
import { mockSpinner, mockChalk } from "../../../vitest.setup.js";
import { DevkitError } from "../../../src/utils/errors/base.js";

const { mockHandleErrorAndExit } = vi.hoisted(() => ({
  mockHandleErrorAndExit: vi.fn(),
}));

let actionFn: any;
vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("setupListCommand", () => {
  let mockProgram: any;

  const sampleConfig = {
    templates: {
      javascript: {
        templates: {
          "vue-basic": {
            description: "A basic Vue template",
            location: "https://github.com/vuejs/vue",
          },
          "react-basic": {
            description: "A basic React template",
            location: "https://github.com/facebook/react",
          },
        },
      },
      typescript: {
        templates: {
          "ts-node": {
            description: "A simple TS project",
            location: "https://github.com/microsoft/TypeScript-Node-Starter",
          },
        },
      },
    },
  };

  const emptyConfig = { templates: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    actionFn = vi.fn();
    mockProgram = {
      command: vi.fn(() => mockProgram),
      alias: vi.fn(() => mockProgram),
      description: vi.fn(() => mockProgram),
      argument: vi.fn(() => mockProgram),
      action: vi.fn((fn) => {
        actionFn = fn;
        return mockProgram;
      }),
    };
  });

  it("should set up the list command correctly", () => {
    setupListCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    expect(mockProgram.command).toHaveBeenCalledWith("list");
    expect(mockProgram.alias).toHaveBeenCalledWith("ls");
    expect(mockProgram.description).toHaveBeenCalledWith(
      "list.command.description",
    );
    expect(mockProgram.argument).toHaveBeenCalledWith(
      "[language]",
      expect.any(String),
      "",
    );
  });

  it("should list all templates when no language is specified", async () => {
    setupListCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    await actionFn("");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("\n", "list.templates.header");

    expect(consoleLogSpy).toHaveBeenCalledWith("\n", `list.templates.header`);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      " - vue-basic - A basic Vue template",
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      " - react-basic - A basic React template",
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `\n${mockChalk.blue.bold("TYPESCRIPT")}:`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      " - ts-node - A simple TS project",
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should list templates for a specific language", async () => {
    setupListCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    await actionFn("javascript");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("\n", "list.templates.header");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `\n${mockChalk.blue.bold("JAVASCRIPT")}:`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      " - vue-basic - A basic Vue template",
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      " - react-basic - A basic React template",
    );

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      `\n${mockChalk.blue.bold("TYPESCRIPT")}:`,
    );
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should succeed and show a message when no templates are found", async () => {
    setupListCommand({
      program: mockProgram,
      config: emptyConfig,
      source: "local",
    });
    await actionFn("");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalledWith(
      mockChalk.yellow("list.templates.not_found"),
    );
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
  });

  it("should throw a DevkitError if the language is not found", async () => {
    setupListCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    await actionFn("python");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        "error.language_config_not_found- options language:python",
      ),
      mockSpinner,
    );
  });

  it("should throw a DevkitError if the language has no templates", async () => {
    const emptyLanguageConfig = {
      templates: {
        javascript: {
          templates: {},
        },
      },
    };
    setupListCommand({
      program: mockProgram,
      config: emptyLanguageConfig,
      source: "local",
    });
    await actionFn("javascript");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
      new DevkitError(
        "error.language_config_not_found- options language:javascript",
      ),
      mockSpinner,
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    const mockError = new Error("Unexpected error");
    vi.spyOn(Object, "entries").mockImplementationOnce(() => {
      throw mockError;
    });

    setupListCommand({
      program: mockProgram,
      config: sampleConfig,
      source: "local",
    });
    await actionFn("");

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockHandleErrorAndExit).toHaveBeenCalledWith(mockError, mockSpinner);
  });
});
