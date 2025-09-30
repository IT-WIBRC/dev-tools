import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleInteractiveConfig } from "../../../../src/commands/config/prompts.js";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "../../../../src/commands/config/logic.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";

const {
  mockSelect,
  mockInput,
  mockPForPackageManager,
  mockPromptForCacheStrategy,
  mockPtForLanguage,
} = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInput: vi.fn(),
  mockPromptForCacheStrategy: vi.fn(),
  mockPtForLanguage: vi.fn(),
  mockPForPackageManager: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
  select: mockSelect,
  input: mockInput,
}));

vi.mock("../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveSettingsUpdate: vi.fn(),
  handleNonInteractiveTemplateUpdate: vi.fn(),
}));

vi.mock("#core/prompts/prompts.js", () => ({
  promptForCacheStrategy: mockPromptForCacheStrategy,
  promptForLanguage: mockPtForLanguage,
  promptForPackageManager: mockPForPackageManager,
}));

const SUCCESS_CONFIG_UPDATED_KEY = "messages.success.config_updated";
const SUCCESS_TEMPLATE_UPDATED_KEY = "messages.success.template_updated";
const INTERACTIVE_SUCCESS_KEY = "commands.config.interactive.success";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle a full settings update flow correctly (language) and log success messages", async () => {
    mockSelect.mockResolvedValueOnce("settings");
    mockSelect.mockResolvedValueOnce("language");
    mockPtForLanguage.mockResolvedValueOnce("fr");

    await handleInteractiveConfig(baseConfig, false);

    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(mockPtForLanguage).toHaveBeenCalledTimes(1);
    expect(vi.mocked(handleNonInteractiveSettingsUpdate)).toHaveBeenCalledWith(
      "language",
      "fr",
      false,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(SUCCESS_CONFIG_UPDATED_KEY),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(INTERACTIVE_SUCCESS_KEY),
    );
  });

  it("should handle a full template update flow correctly (description) and log success messages", async () => {
    mockSelect.mockResolvedValueOnce("templates");
    mockPtForLanguage.mockResolvedValueOnce("typescript");
    mockSelect.mockResolvedValueOnce("web");
    mockSelect.mockResolvedValueOnce("description");
    mockInput.mockResolvedValueOnce("A cool new description");

    await handleInteractiveConfig(baseConfig, false);

    expect(mockSelect).toHaveBeenCalledTimes(3);
    expect(mockPtForLanguage).toHaveBeenCalledOnce();
    expect(mockInput).toHaveBeenCalledOnce();
    expect(vi.mocked(handleNonInteractiveTemplateUpdate)).toHaveBeenCalledWith(
      "typescript",
      "web",
      { description: "A cool new description" },
      false,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(SUCCESS_TEMPLATE_UPDATED_KEY, { templateName: "web" }),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(INTERACTIVE_SUCCESS_KEY),
    );
  });

  it("should handle a template update with a special prompt (packageManager)", async () => {
    mockSelect.mockResolvedValueOnce("templates");
    mockPtForLanguage.mockResolvedValueOnce("typescript");
    mockSelect.mockResolvedValueOnce("web");
    mockSelect.mockResolvedValueOnce("packageManager");
    mockPForPackageManager.mockResolvedValueOnce("bun");

    await handleInteractiveConfig(baseConfig, false);

    expect(mockPForPackageManager).toHaveBeenCalledWith(true);
    expect(vi.mocked(handleNonInteractiveTemplateUpdate)).toHaveBeenCalledWith(
      "typescript",
      "web",
      { packageManager: "bun" },
      false,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(SUCCESS_TEMPLATE_UPDATED_KEY, { templateName: "web" }),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(INTERACTIVE_SUCCESS_KEY),
    );
  });

  it("should handle a settings update with a special prompt (cacheStrategy)", async () => {
    mockSelect.mockResolvedValueOnce("settings");
    mockSelect.mockResolvedValueOnce("cacheStrategy");
    mockPromptForCacheStrategy.mockResolvedValueOnce("daily");

    await handleInteractiveConfig(baseConfig, true);

    expect(mockPromptForCacheStrategy).toHaveBeenCalledWith(true);
    expect(vi.mocked(handleNonInteractiveSettingsUpdate)).toHaveBeenCalledWith(
      "cacheStrategy",
      "daily",
      true,
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(SUCCESS_CONFIG_UPDATED_KEY),
    );
    expect(mockLogger.log).toHaveBeenCalledWith(
      mocktFn(INTERACTIVE_SUCCESS_KEY),
    );
  });
});
