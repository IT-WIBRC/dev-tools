import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateDynamicHelpText } from "../../../../src/utils/i18n/generate-dynamic-help-text.js";

const mockt = vi.fn();
vi.mock("#utils/i18n/translator.js", () => ({
  t: (key: string, options: { options: string }) => mockt(key, options),
}));

vi.mock("#utils/schema/schema.js", () => ({
  VALID_CACHE_STRATEGIES: ["always-refresh", "never-refresh", "daily"],
  VALID_PACKAGE_MANAGERS: ["npm", "yarn", "pnpm"],
  SUPPORTED_LANGUAGES: ["en", "fr"],
  ProgrammingLanguage: {
    Javascript: "Javascript",
    Typescript: "Typescript",
    Nodejs: "Nodejs",
  },
  ProgrammingLanguageAlias: {
    js: "javascript",
    ts: "typescript",
    node: "nodejs",
  },
  DisplayModes: {
    Tree: "Tree",
    List: "List",
  },
}));

const I18N_KEYS = {
  CACHE: "help.option.cacheStrategy",
  PM: "help.option.packageManager",
  LANG: "help.option.language",
  SUPPORTED_LANG: "help.option.supportedLanguage",
} as const;

describe("generateDynamicHelpText", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockt.mockImplementation((i18nKey, options) => {
      return `[i18n:${i18nKey}] - Options are: ${options.options}`;
    });
  });

  it("should generate help text for 'cacheStrategy' with correct formatting", () => {
    const i18nKey = I18N_KEYS.CACHE;
    const result = generateDynamicHelpText("cacheStrategy", i18nKey);

    const expectedOptions = "`always-refresh`, `never-refresh`, `daily`";

    expect(mockt).toHaveBeenCalledWith(i18nKey, { options: expectedOptions });
    expect(result).toBe(`[i18n:${i18nKey}] - Options are: ${expectedOptions}`);
  });

  it("should generate help text for 'packageManager' with correct formatting", () => {
    const i18nKey = I18N_KEYS.PM;
    const result = generateDynamicHelpText("packageManager", i18nKey);

    const expectedOptions = "`npm`, `yarn`, `pnpm`";

    expect(mockt).toHaveBeenCalledWith(i18nKey, { options: expectedOptions });
    expect(result).toBe(`[i18n:${i18nKey}] - Options are: ${expectedOptions}`);
  });

  it("should generate help text for 'language' with correct formatting", () => {
    const i18nKey = I18N_KEYS.LANG;
    const result = generateDynamicHelpText("language", i18nKey);

    const expectedOptions = "`en`, `fr`";

    expect(mockt).toHaveBeenCalledWith(i18nKey, { options: expectedOptions });
    expect(result).toBe(`[i18n:${i18nKey}] - Options are: ${expectedOptions}`);
  });

  it("should generate help text for 'supportedLanguage' in lowercase and correct formatting", () => {
    const i18nKey = I18N_KEYS.SUPPORTED_LANG;
    const result = generateDynamicHelpText("supportedLanguage", i18nKey);

    const expectedOptions =
      "`javascript`, `typescript`, `nodejs`, `js`, `ts`, `node`";

    expect(mockt).toHaveBeenCalledWith(i18nKey, { options: expectedOptions });
    expect(result).toBe(`[i18n:${i18nKey}] - Options are: ${expectedOptions}`);
  });

  it("should correctly handle a scenario with no options (empty list)", async () => {
    vi.resetModules();

    vi.doMock("#utils/schema/schema.js", async () => ({
      VALID_CACHE_STRATEGIES: [],
      VALID_PACKAGE_MANAGERS: (
        await vi.importActual("../../../../src/utils/schema/schema.js")
      ).VALID_PACKAGE_MANAGERS,
      SUPPORTED_LANGUAGES: (
        await vi.importActual("../../../../src/utils/schema/schema.js")
      ).SUPPORTED_LANGUAGES,
      ProgrammingLanguage: (
        await vi.importActual("../../../../src/utils/schema/schema.js")
      ).ProgrammingLanguage,
      ProgrammingLanguageAlias: (
        await vi.importActual("../../../../src/utils/schema/schema.js")
      ).ProgrammingLanguageAlias,
      DisplayModes: (
        await vi.importActual("../../../../src/utils/schema/schema.js")
      ).DisplayModes,
    }));

    const { generateDynamicHelpText: generateDynamicHelpTextEmpty } =
      await import("../../../../src/utils/i18n/generate-dynamic-help-text.js");

    const emptyI18nKey = "help.empty.test";
    const result = generateDynamicHelpTextEmpty("cacheStrategy", emptyI18nKey);

    expect(mockt).toHaveBeenCalledWith(emptyI18nKey, { options: "" });
    expect(result).toBe(`[i18n:${emptyI18nKey}] - Options are: `);

    vi.resetModules();
    vi.doMock("#utils/schema/schema.js", () =>
      vi.importActual("#utils/schema/schema.js"),
    );
    await import("../../../../src/utils/i18n/generate-dynamic-help-text.js");
  });
});
