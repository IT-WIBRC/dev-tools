import { describe, it, expect } from "vitest";
import {
  ProgrammingLanguage,
  JavascriptPackageManagers,
  PackageManagers,
  VALID_PACKAGE_MANAGERS,
  VALID_CACHE_STRATEGIES,
  TextLanguages,
  SUPPORTED_LANGUAGES,
  defaultCliConfig,
  CONFIG_FILE_NAMES,
  FILE_NAMES,
} from "../../../../src/utils/configs/schema.js";

describe("Schema Constants and Defaults", () => {
  it("should have correct ProgrammingLanguage values", () => {
    expect(ProgrammingLanguage.Javascript).toBe("Javascript");
  });

  it("should have correct JavascriptPackageManagers values", () => {
    expect(JavascriptPackageManagers.Bun).toBe("bun");
    expect(JavascriptPackageManagers.Npm).toBe("npm");
    expect(JavascriptPackageManagers.Yarn).toBe("yarn");
    expect(JavascriptPackageManagers.Deno).toBe("deno");
    expect(JavascriptPackageManagers.Pnpm).toBe("pnpm");
  });

  it("should have correct PackageManagers values", () => {
    expect(PackageManagers.Bun).toBe("bun");
    expect(PackageManagers.Npm).toBe("npm");
    expect(PackageManagers.Yarn).toBe("yarn");
    expect(PackageManagers.Deno).toBe("deno");
    expect(PackageManagers.Pnpm).toBe("pnpm");
  });

  it("should correctly define VALID_PACKAGE_MANAGERS", () => {
    const expected = ["bun", "npm", "yarn", "deno", "pnpm"];
    expect(VALID_PACKAGE_MANAGERS).toEqual(expect.arrayContaining(expected));
    expect(VALID_PACKAGE_MANAGERS.length).toBe(expected.length);
    expect(Object.isSealed(VALID_PACKAGE_MANAGERS)).toBe(true);
  });

  it("should have correct VALID_CACHE_STRATEGIES values", () => {
    expect(VALID_CACHE_STRATEGIES).toEqual([
      "always-refresh",
      "never-refresh",
      "daily",
    ]);
  });

  it("should have correct TextLanguages values", () => {
    expect(TextLanguages.English).toBe("en");
    expect(TextLanguages.French).toBe("fr");
  });

  it("should correctly define SUPPORTED_LANGUAGES", () => {
    const expected = ["en", "fr"];
    expect(SUPPORTED_LANGUAGES).toEqual(expect.arrayContaining(expected));
    expect(SUPPORTED_LANGUAGES.length).toBe(expected.length);
    expect(Object.isSealed(SUPPORTED_LANGUAGES)).toBe(true);
  });

  it("should have the correct CONFIG_FILE_NAMES", () => {
    expect(CONFIG_FILE_NAMES).toEqual([".devkitrc", ".devkitrc.json"]);
  });

  it("should have the correct FILE_NAMES", () => {
    expect(FILE_NAMES.packageJson).toBe("package.json");
    expect(FILE_NAMES.common.git).toBe(".git");
    expect(FILE_NAMES.javascript.lockFiles).toEqual([
      "package-lock.json",
      "bun.lockb",
      "yarn.lock",
      "pnpm-lock.yaml",
    ]);
  });

  it("should have a correct and complete defaultCliConfig", () => {
    expect(defaultCliConfig.settings.defaultPackageManager).toBe(
      PackageManagers.Bun,
    );
    expect(defaultCliConfig.settings.cacheStrategy).toBe("daily");
    expect(defaultCliConfig.settings.language).toBe(TextLanguages.English);

    expect(defaultCliConfig.templates.javascript?.templates.vue).toBeDefined();
    expect(
      defaultCliConfig.templates.javascript?.templates?.vue?.location,
    ).toContain("{pm} create vue@latest");

    expect(defaultCliConfig.templates.javascript?.templates.nuxt).toBeDefined();
    expect(
      defaultCliConfig.templates.javascript?.templates?.nuxt?.location,
    ).toContain("{pm} create nuxt@latest");

    expect(defaultCliConfig.templates.javascript?.templates.nest).toBeDefined();
    expect(
      defaultCliConfig.templates.javascript?.templates?.nest?.location,
    ).toContain("{pm} install -g @nestjs/cli && nest new");
  });
});
