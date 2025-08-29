import { vi, describe, it, expect, beforeEach } from "vitest";
import { findLocalesDir } from "../../../../src/utils/files/locales.js";

const { mockFindPackageRoot } = vi.hoisted(() => ({
  mockFindPackageRoot: vi.fn(),
}));

vi.mock("../../../../src/utils/files/finder.js", () => ({
  findPackageRoot: mockFindPackageRoot,
}));

describe("Root Finder Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findLocalesDir should return the locales directory path", async () => {
    mockFindPackageRoot.mockResolvedValueOnce("/test/package");
    const result = await findLocalesDir();
    expect(result).toBe("/test/package/locales");
  });
});
