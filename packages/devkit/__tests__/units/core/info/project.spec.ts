import { vi, describe, it, expect, beforeEach } from "vitest";
import { getProjectVersion } from "../../../../src/core/info/project.js";
import { mockLogger, mocktFn } from "../../../../vitest.setup.js";

vi.mock("path", () => ({
  default: {
    join: vi.fn((...args) => args.join("/")),
  },
}));

const { mockFindPackageRoot, mockFsReadJson } = vi.hoisted(() => ({
  mockFindPackageRoot: vi.fn(),
  mockFsReadJson: vi.fn(),
}));

vi.mock("#utils/fs/file.js", () => ({
  default: { readJson: mockFsReadJson },
}));

vi.mock("#utils/fs/finder.js", () => ({
  findPackageRoot: mockFindPackageRoot,
}));

vi.mock("#utils/schema/schema.js", () => ({
  FILE_NAMES: { packageJson: "package.json" },
}));

const PACKAGE_ROOT_NOT_FOUND_KEY = "errors.system.package_root_not_found";
const VERSION_READ_FAIL_KEY = "errors.system.version_read_fail";

describe("getProjectVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger.error.mockClear();
    mockLogger.dimmed.mockClear();
  });

  it("should return the project version from package.json", async () => {
    mockFindPackageRoot.mockResolvedValueOnce("/mock/project/root");
    mockFsReadJson.mockResolvedValueOnce({ version: "1.2.3" });

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalledOnce();
    expect(mockFsReadJson).toHaveBeenCalledWith(
      "/mock/project/root/package.json",
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(version).toBe("1.2.3");
  });

  it("should return '0.0.0' and log an error if package root is not found", async () => {
    const rootNotFoundErrorMessage = mocktFn(PACKAGE_ROOT_NOT_FOUND_KEY);
    const expectedErrorMessage = `${VERSION_READ_FAIL_KEY}: ${rootNotFoundErrorMessage}`;

    mockFindPackageRoot.mockResolvedValue(null);

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalled();
    expect(mockFsReadJson).not.toHaveBeenCalled();

    expect(mockLogger.error).toHaveBeenCalledWith(expectedErrorMessage, "INFO");
    expect(mockLogger.dimmed).toHaveBeenCalled();
    expect(version).toBe("0.0.0");
  });

  it("should return '0.0.0', log an error, and log stack if reading package.json fails", async () => {
    const readError = new Error("Failed to read file");
    readError.stack = "Mock stack trace";
    const expectedErrorMessage = `${VERSION_READ_FAIL_KEY}: Failed to read file`;

    mockFindPackageRoot.mockResolvedValue("/mock/project/root");
    mockFsReadJson.mockRejectedValue(readError);

    const version = await getProjectVersion();

    expect(mockFindPackageRoot).toHaveBeenCalled();
    expect(mockFsReadJson).toHaveBeenCalledWith(
      "/mock/project/root/package.json",
    );

    expect(mockLogger.error).toHaveBeenCalledWith(expectedErrorMessage, "INFO");

    expect(mockLogger.dimmed).toHaveBeenCalledWith(readError.stack);
    expect(version).toBe("0.0.0");
  });

  it("should return '0.0.0' and log a generic error if non-Error is thrown", async () => {
    const genericError = 12345;
    const expectedErrorMessage = VERSION_READ_FAIL_KEY;

    mockFindPackageRoot.mockResolvedValue("/mock/project/root");
    mockFsReadJson.mockRejectedValue(genericError);

    const version = await getProjectVersion();

    expect(mockLogger.error).toHaveBeenCalledWith(expectedErrorMessage, "INFO");
    expect(mockLogger.dimmed).not.toHaveBeenCalled();
    expect(version).toBe("0.0.0");
  });
});
