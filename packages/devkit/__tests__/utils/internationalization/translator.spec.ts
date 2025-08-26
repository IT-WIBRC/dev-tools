import { describe, it, expect, beforeEach } from "vitest";
import { t } from "../../../src/utils/internationalization/translator.js";
import { translations } from "../../../src/utils/internationalization/translation-loader.js";

const mockTranslations = {
  command: {
    create: {
      description: "Create a new project from a template",
    },
    add: {
      success: "Template {templateName} added successfully",
    },
    remove: {
      success: "Template removed successfully",
    },
  },
  nested: {
    message: {
      hello: "Hello {name}!",
      goodbye: "Goodbye!",
    },
  },
};

describe("t", () => {
  beforeEach(() => {
    Object.keys(translations).forEach((key) => delete translations[key]);
    Object.assign(translations, mockTranslations);
  });

  it("should return the correct translated string for a simple key", () => {
    const translatedString = t("command.remove.success");
    expect(translatedString).toBe("Template removed successfully");
  });

  it("should replace a variable in the translated string", () => {
    const translatedString = t("command.add.success", {
      templateName: "my-template",
    });
    expect(translatedString).toBe("Template my-template added successfully");
  });

  it("should return the key itself if the translated string is not found", () => {
    const key = "non-existent.key" as any;
    const translatedString = t(key);
    expect(translatedString).toBe(key);
  });

  it("should correctly handle nested keys", () => {
    const translatedString = t("nested.message.goodbye" as any);
    expect(translatedString).toBe("Goodbye!");
  });

  it("should correctly handle nested keys with variables", () => {
    const translatedString = t("nested.message.hello" as any, {
      name: "Alice",
    });
    expect(translatedString).toBe("Hello Alice!");
  });

  it("should not replace variables if none are provided", () => {
    const translatedString = t("command.add.success");
    expect(translatedString).toBe("Template {templateName} added successfully");
  });

  it("should return the key if the nested path does not exist", () => {
    const key = "nested.message.non-existent" as any;
    const translatedString = t(key);
    expect(translatedString).toBe(key);
  });
});
