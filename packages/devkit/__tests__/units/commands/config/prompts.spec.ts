import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleInteractiveConfig } from "../../../../src/commands/config/prompts.js";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "../../../../src/commands/config/logic.js";
import {
  promptForLanguage,
  promptForPackageManager,
} from "../../../../src/utils/prompts.js";
import { mocktFn } from "../../../../vitest.setup.ts";

const { mockSelect, mockInput } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInput: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
  select: mockSelect,
  input: mockInput,
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveSettingsUpdate: vi.fn(),
  handleNonInteractiveTemplateUpdate: vi.fn(),
}));

vi.mock("../../../../src/utils/prompts.js", () => ({
  promptForCacheStrategy: vi.fn(),
  promptForLanguage: vi.fn(),
  promptForPackageManager: vi.fn(),
}));

describe("Interactive Config Prompts", () => {
  const baseConfig = {
    settings: {
      language: "en",
      defaultPackageManager: "npm",
    },
    templates: {
      typescript: {
        templates: {
          web: {
            description: "A web template",
            location: "https://example.com/web",
            alias: "w",
            cacheStrategy: "network_only",
            packageManager: "npm",
          },
          cli: {
            description: "A CLI template",
            location: "https://example.com/cli",
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle a full settings update flow correctly (language)", async () => {
    mockSelect.mockResolvedValueOnce("settings");
    mockSelect.mockResolvedValueOnce("language");
    vi.mocked(promptForLanguage).mockResolvedValueOnce("fr");

    await handleInteractiveConfig(baseConfig, false);

    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(vi.mocked(promptForLanguage)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(handleNonInteractiveSettingsUpdate)).toHaveBeenCalledWith(
      "language",
      "fr",
      false,
    );
    expect(console.log).toHaveBeenCalledWith(mocktFn("config.set.success"));
  });

  it("should handle a full template update flow correctly (description)", async () => {
    mockSelect.mockResolvedValueOnce("templates");
    vi.mocked(promptForLanguage).mockResolvedValueOnce("typescript");
    mockSelect.mockResolvedValueOnce("web");
    mockSelect.mockResolvedValueOnce("description");
    mockInput.mockResolvedValueOnce("A cool new description");

    await handleInteractiveConfig(baseConfig, false);

    expect(mockSelect).toHaveBeenCalledTimes(3);
    expect(vi.mocked(promptForLanguage)).toHaveBeenCalledOnce();
    expect(mockInput).toHaveBeenCalledOnce();
    expect(vi.mocked(handleNonInteractiveTemplateUpdate)).toHaveBeenCalledWith(
      "typescript",
      "web",
      { description: "A cool new description" },
      false,
    );
    expect(console.log).toHaveBeenCalledWith(
      mocktFn("config.update.success", { templateName: "web" }),
    );
  });

  it("should handle a template update with a special prompt (packageManager)", async () => {
    mockSelect.mockResolvedValueOnce("templates");
    vi.mocked(promptForLanguage).mockResolvedValueOnce("typescript");
    mockSelect.mockResolvedValueOnce("web");
    mockSelect.mockResolvedValueOnce("packageManager");
    vi.mocked(promptForPackageManager).mockResolvedValueOnce("bun");

    await handleInteractiveConfig(baseConfig, false);

    expect(vi.mocked(promptForPackageManager)).toHaveBeenCalledWith(true);
    expect(vi.mocked(handleNonInteractiveTemplateUpdate)).toHaveBeenCalledWith(
      "typescript",
      "web",
      { packageManager: "bun" },
      false,
    );
  });
});
