import { vi, describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { copyLocalTemplate } from "../../src/scaffolding/local-template.js";
import { DevkitError } from "../../src/utils/errors/base.js";
import { mocktFn, mockSpinner } from "../../vitest.setup.js";

const {
  mockCopyJavascriptTemplate,
  mockUpdateJavascriptProjectName,
  mockFindPackageRoot,
} = vi.hoisted(() => ({
  mockCopyJavascriptTemplate: vi.fn(),
  mockUpdateJavascriptProjectName: vi.fn(),
  mockFindPackageRoot: vi.fn(),
}));

vi.mock("#utils/template-utils.js", () => ({
  copyJavascriptTemplate: mockCopyJavascriptTemplate,
}));

vi.mock("#utils/update-project-name.js", () => ({
  updateJavascriptProjectName: mockUpdateJavascriptProjectName,
}));

vi.mock("#utils/files/finder.js", () => ({
  findPackageRoot: mockFindPackageRoot,
}));

describe("copyLocalTemplate", () => {
  const options = {
    projectName: "my-project",
    spinner: mockSpinner,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue("/current/dir");
  });

  it("should copy a local template when the source path is absolute", async () => {
    const sourcePath = "/absolute/path/to/template";
    await copyLocalTemplate({ ...options, sourcePath });

    const expectedProjectPath = path.join(process.cwd(), options.projectName);

    expect(mockCopyJavascriptTemplate).toHaveBeenCalledWith(
      sourcePath,
      expectedProjectPath,
    );
    expect(mockUpdateJavascriptProjectName).toHaveBeenCalledWith(
      expectedProjectPath,
      options.projectName,
    );
    expect(mockFindPackageRoot).not.toHaveBeenCalled();
  });

  it("should copy a local template when the source path is relative", async () => {
    const sourcePath = "./relative/path/to/template";
    const packageRoot = "/project/root";
    mockFindPackageRoot.mockResolvedValueOnce(packageRoot);

    await copyLocalTemplate({ ...options, sourcePath });

    const expectedProjectPath = path.join(process.cwd(), options.projectName);
    const expectedSourcePath = path.join(packageRoot, sourcePath);

    expect(mockCopyJavascriptTemplate).toHaveBeenCalledWith(
      expectedSourcePath,
      expectedProjectPath,
    );
    expect(mockUpdateJavascriptProjectName).toHaveBeenCalledWith(
      expectedProjectPath,
      options.projectName,
    );
    expect(mockFindPackageRoot).toHaveBeenCalled();
  });

  it("should throw a DevkitError if copying fails", async () => {
    const sourcePath = "/absolute/path/to/template";
    const error = new Error("Copying failed");
    mockCopyJavascriptTemplate.mockRejectedValueOnce(error);

    await expect(copyLocalTemplate({ ...options, sourcePath })).rejects.toThrow(
      DevkitError,
    );
    expect(mocktFn).toHaveBeenCalledWith("scaffolding.copy.fail");
  });
});
