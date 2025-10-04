import { describe, it, expect } from "vitest";
import { ProgrammingLanguageAlias } from "../../../../src/utils/schema/schema.js";
import { mapLanguageAliasToCanonicalKey } from "../../../../src/core/config/language.js";

const aliases: Record<string, string> = ProgrammingLanguageAlias as Record<
  string,
  string
>;

describe("mapLanguageAliasToCanonicalKey", () => {
  it("should map all short aliases (js, ts, node) to their canonical keys", () => {
    expect(mapLanguageAliasToCanonicalKey("js")).toBe(aliases.js);
    expect(mapLanguageAliasToCanonicalKey("ts")).toBe(aliases.ts);
    expect(mapLanguageAliasToCanonicalKey("node")).toBe(aliases.node);
  });

  it("should return the canonical key when the input is already in canonical form (lowercase)", () => {
    expect(mapLanguageAliasToCanonicalKey("javascript")).toBe("javascript");
    expect(mapLanguageAliasToCanonicalKey("typescript")).toBe("typescript");
    expect(mapLanguageAliasToCanonicalKey("nodejs")).toBe("nodejs");
  });

  it("should return the canonical key in lowercase regardless of input casing (e.g., TS, JavaScript)", () => {
    expect(mapLanguageAliasToCanonicalKey("TS")).toBe("typescript");
    expect(mapLanguageAliasToCanonicalKey("jS")).toBe("javascript");
    expect(mapLanguageAliasToCanonicalKey("NoDe")).toBe("nodejs");

    expect(mapLanguageAliasToCanonicalKey("JavaScript")).toBe("javascript");
    expect(mapLanguageAliasToCanonicalKey("TYPEscript")).toBe("typescript");
    expect(mapLanguageAliasToCanonicalKey("NodeJS")).toBe("nodejs");
  });

  it("should return the lowercase input when the input is not a recognized alias or canonical key", () => {
    expect(mapLanguageAliasToCanonicalKey("python")).toBe("python");
    expect(mapLanguageAliasToCanonicalKey("UnknownLang")).toBe("unknownlang");
    expect(mapLanguageAliasToCanonicalKey("")).toBe("");
  });
});
