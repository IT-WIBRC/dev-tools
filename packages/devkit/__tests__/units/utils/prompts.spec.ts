import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  promptForCacheStrategy,
  promptForLanguage,
  promptForPackageManager,
} from "../../../src/utils/prompts.js";
import {
  ProgrammingLanguage,
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
} from "../../integrations/common.js";

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
  select: mockSelect,
}));

describe("prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("promptForLanguage", () => {
    it("should call select with the correct required message and choices", async () => {
      const expectedReturnValue = "typescript";
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForLanguage();

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.language (required)",
        choices: Object.values(ProgrammingLanguage).map((lang) => ({
          name: lang,
          value: lang.toLowerCase(),
        })),
        default: undefined,
      });
      expect(result).toBe(expectedReturnValue);
    });

    it("should call select with the correct optional message and a default value", async () => {
      const expectedReturnValue = "javascript";
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForLanguage(false, "javascript");

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.language (optional)",
        choices: Object.values(ProgrammingLanguage).map((lang) => ({
          name: lang,
          value: lang.toLowerCase(),
        })),
        default: "javascript",
      });
      expect(result).toBe(expectedReturnValue);
    });
  });

  describe("promptForPackageManager", () => {
    it("should call select with the correct required message and choices", async () => {
      const expectedReturnValue = "npm";
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForPackageManager();

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.package_manager (required)",
        choices: VALID_PACKAGE_MANAGERS.map((pm) => ({ name: pm, value: pm })),
        default: undefined,
      });
      expect(result).toBe(expectedReturnValue);
    });

    it("should call select with the correct optional message and a null choice", async () => {
      const expectedReturnValue = null;
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForPackageManager(false);

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.package_manager (optional)",
        choices: [
          ...VALID_PACKAGE_MANAGERS.map((pm) => ({ name: pm, value: pm })),
          { name: "common.none", value: null },
        ],
        default: undefined,
      });
      expect(result).toBe(expectedReturnValue);
    });
  });

  describe("promptForCacheStrategy", () => {
    it("should call select with the correct required message and choices", async () => {
      const expectedReturnValue = "cache_only";
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForCacheStrategy();

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.cache_strategy (required)",
        choices: VALID_CACHE_STRATEGIES.map((strategy) => ({
          name: strategy,
          value: strategy,
        })),
        default: undefined,
      });
      expect(result).toBe(expectedReturnValue);
    });

    it("should call select with the correct optional message and a null choice", async () => {
      const expectedReturnValue = null;
      mockSelect.mockResolvedValueOnce(expectedReturnValue);

      const result = await promptForCacheStrategy(false);

      expect(mockSelect).toHaveBeenCalledWith({
        message: "cli.add_template.prompts.cache_strategy (optional)",
        choices: [
          ...VALID_CACHE_STRATEGIES.map((strategy) => ({
            name: strategy,
            value: strategy,
          })),
          { name: "common.none", value: null },
        ],
        default: undefined,
      });
      expect(result).toBe(expectedReturnValue);
    });
  });
});
