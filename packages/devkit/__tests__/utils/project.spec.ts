import { vi, describe, it, expect, beforeEach } from "vitest";
import { getProjectVersion } from "../../src/utils/project.js";

const { mockFindPackageRoot, mockFsReadJson } = vi.hoisted(() => ({
  mockFindPackageRoot: vi.fn(),
  mockFsReadJson: vi.fn(),
}));

vi.mock("fs-extra", () => ({ default: { readJson: mockFsReadJson } }));

vi.mock("#utils/files/finder.js", () => ({
  findPackageRoot: mockFindPackageRoot,
}));

describe("GetProjectVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the project version from package.json", async () => {
    mockFindPackageRoot.mockResolvedValueOnce("/mock/project/root");
    mockFsReadJson.mockResolvedValueOnce({ version: "1.2.3" });

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalledOnce();
    expect(mockFsReadJson).toHaveBeenCalledWith(
      "/mock/project/root/package.json",
    );
    expect(version).toBe("1.2.3");
  });

  it("should return '0.0.0' and log an error if package root is not found", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFindPackageRoot.mockResolvedValue(null);

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalled();
    expect(mockFsReadJson).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "error.version.read_fail",
      new Error("error.package.root.not_found"),
    );
    expect(version).toBe("0.0.0");
    consoleErrorSpy.mockRestore();
  });

  it("should return '0.0.0' and log an error if reading package.json fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const readError = new Error("Failed to read file");
    mockFindPackageRoot.mockResolvedValue("/mock/project/root");
    mockFsReadJson.mockRejectedValue(readError);

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalled();
    expect(mockFsReadJson).toHaveBeenCalledWith(
      "/mock/project/root/package.json",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "error.version.read_fail",
      readError,
    );
    expect(version).toBe("0.0.0");
    consoleErrorSpy.mockRestore();
  });
});
