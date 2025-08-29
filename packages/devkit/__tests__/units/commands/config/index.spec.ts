import { vi, describe, it, expect, beforeEach } from "vitest";
import { setupConfigCommand } from "../../../../src/commands/config/index.js";
import type { CliConfig } from "../../../../src/utils/configs/schema.js";

const { mockSetupConfigSetCommand, mockSetupConfigUpdateCommand } = vi.hoisted(
  () => ({
    mockSetupConfigSetCommand: vi.fn(),
    mockSetupConfigUpdateCommand: vi.fn(),
  }),
);

vi.mock("#commands/config/set.js", () => ({
  setupConfigSetCommand: mockSetupConfigSetCommand,
}));

vi.mock("#commands/config/update.js", () => ({
  setupConfigUpdateCommand: mockSetupConfigUpdateCommand,
}));

describe("setupConfigCommand", () => {
  let mockProgram: any;
  const mockConfig: CliConfig = {
    settings: {
      language: "en",
      cacheStrategy: "never-refresh",
      defaultPackageManager: "bun",
    },
    templates: {},
  };
  const mockSource = "local";
  const mockConfigCommand = {
    command: vi.fn(() => mockConfigCommand),
    alias: vi.fn(() => mockConfigCommand),
    description: vi.fn(() => mockConfigCommand),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProgram = {
      command: vi.fn(() => mockConfigCommand),
    };
  });

  it("should set up the config command correctly", () => {
    setupConfigCommand({
      program: mockProgram,
      config: mockConfig,
      source: mockSource,
    });
    expect(mockProgram.command).toHaveBeenCalledOnce();
    expect(mockProgram.command).toHaveBeenCalledWith("config");

    expect(mockConfigCommand.alias).toHaveBeenCalledOnce();
    expect(mockConfigCommand.alias).toHaveBeenCalledWith("cf");

    expect(mockConfigCommand.description).toHaveBeenCalledOnce();
    expect(mockConfigCommand.description).toHaveBeenCalledWith(
      "config.command.description",
    );
  });

  it("should call setup functions for sub-commands with the correct arguments", () => {
    setupConfigCommand({
      program: mockProgram,
      config: mockConfig,
      source: mockSource,
    });
    const expectedOptions = {
      program: mockConfigCommand,
      config: mockConfig,
      source: mockSource,
    };
    expect(mockSetupConfigSetCommand).toHaveBeenCalledOnce();
    expect(mockSetupConfigSetCommand).toHaveBeenCalledWith(expectedOptions);
  });
});
