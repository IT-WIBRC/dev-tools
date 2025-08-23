import { vi, describe, it, expect, beforeEach } from "vitest";
import { DevkitError } from "../../../src/utils/errors/base.js";
import {
  findMonorepoRoot,
  findProjectRoot,
  findPackageRoot,
} from "../../../src/utils/files/finder.js";

const { mockFindUp, mockFindPackageRoot } = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockFindPackageRoot: vi.fn(),
}));

vi.mock("../../../src/utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("../../../src/utils/files/locales.js", () => ({
  findLocalesDir: mockFindPackageRoot,
}));

describe("Root Finder Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findMonorepoRoot should return the monorepo root path", async () => {
    mockFindUp.mockResolvedValueOnce("/test/monorepo/pnpm-workspace.yaml");
    const result = await findMonorepoRoot();
    expect(result).toBe("/test/monorepo");
  });

  it("findMonorepoRoot should return null if monorepo root is not found", async () => {
    mockFindUp.mockResolvedValue(null);
    const result = await findMonorepoRoot();
    expect(result).toBeNull();
  });

  it("findProjectRoot should return the project root path", async () => {
    mockFindUp.mockResolvedValue("/test/project/package.json");
    const result = await findProjectRoot();
    expect(result).toBe("/test/project");
  });

  it("findProjectRoot should return null if project root is not found", async () => {
    mockFindUp.mockResolvedValue(null);
    const result = await findProjectRoot();
    expect(result).toBeNull();
  });

  it("findPackageRoot should return the package root path", async () => {
    mockFindUp.mockResolvedValue("/test/package/package.json");
    const result = await findPackageRoot();
    expect(result).toBe("/test/package");
  });

  it("findPackageRoot should throw a DevkitError if package root is not found", async () => {
    mockFindUp.mockResolvedValue(null);
    await expect(findPackageRoot()).rejects.toThrow(DevkitError);
  });
});
