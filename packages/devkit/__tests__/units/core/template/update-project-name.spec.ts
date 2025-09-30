import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockLogger } from "../../../../vitest.setup.js";

const { mockExistsSync, mockReadJson, mockWriteJson } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadJson: vi.fn(),
  mockWriteJson: vi.fn(),
}));

vi.mock("#utils/fs/file.js", () => ({
  default: {
    existsSync: mockExistsSync,
    readJson: mockReadJson,
    writeJson: mockWriteJson,
  },
}));

import { updateJavascriptProjectName } from "../../../../src/core/template/update-project-name.js";
import { FILE_NAMES } from "../../../../src/utils/schema/schema.js";

describe("update-project-name.ts", () => {
  const projectPath = "/test/path";
  const newProjectName = "new-project";
  const packageJsonPath = `/test/path/${FILE_NAMES.packageJson}`;
  const mockPackageJson = {
    name: "old-project",
    version: "1.0.0",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateJavascriptProjectName", () => {
    it("should update the project name in package.json if the file exists", async () => {
      mockExistsSync.mockReturnValueOnce(true);
      mockReadJson.mockResolvedValueOnce(mockPackageJson);

      await updateJavascriptProjectName(projectPath, newProjectName);

      expect(mockExistsSync).toHaveBeenCalledWith(packageJsonPath);
      expect(mockExistsSync).toHaveBeenCalledOnce();

      expect(mockReadJson).toHaveBeenCalledOnce();
      expect(mockReadJson).toHaveBeenCalledWith(packageJsonPath);

      expect(mockWriteJson).toHaveBeenCalledOnce();
      expect(mockWriteJson).toHaveBeenCalledWith(packageJsonPath, {
        ...mockPackageJson,
        name: newProjectName,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should log an error if package.json does not exist", async () => {
      mockExistsSync.mockReturnValueOnce(false);

      await updateJavascriptProjectName(projectPath, newProjectName);

      expect(mockExistsSync).toHaveBeenCalledOnce();
      expect(mockExistsSync).toHaveBeenCalledWith(packageJsonPath);

      expect(mockReadJson).not.toHaveBeenCalled();
      expect(mockWriteJson).not.toHaveBeenCalled();

      expect(mockLogger.error).toHaveBeenCalledOnce();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "errors.system.package_file_not_found",
        "TEMPL",
      );
    });

    it("should log an error if writing to package.json fails", async () => {
      const writeError = new Error("Permission denied");
      mockExistsSync.mockReturnValueOnce(true);
      mockReadJson.mockResolvedValueOnce(mockPackageJson);
      mockWriteJson.mockRejectedValueOnce(writeError);

      await updateJavascriptProjectName(projectPath, newProjectName);

      expect(mockExistsSync).toHaveBeenCalledOnce();
      expect(mockExistsSync).toHaveBeenCalledWith(packageJsonPath);

      expect(mockReadJson).toHaveBeenCalledOnce();
      expect(mockReadJson).toHaveBeenCalledWith(packageJsonPath);

      expect(mockWriteJson).toHaveBeenCalledOnce();
      expect(mockWriteJson).toHaveBeenCalledWith(packageJsonPath, {
        ...mockPackageJson,
        name: newProjectName,
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        "errors.system.package_name_update_fail: Permission denied",
        "TEMPL",
      );
    });
  });
});
