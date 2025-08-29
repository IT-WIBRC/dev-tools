import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockExistsSync, mockReadJson, mockWriteJson } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadJson: vi.fn(),
  mockWriteJson: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    existsSync: mockExistsSync,
    readJson: mockReadJson,
    writeJson: mockWriteJson,
  },
}));

import { updateJavascriptProjectName } from "../../../src/utils/update-project-name.js";
import { FILE_NAMES } from "../../../src/utils/configs/schema.js";

const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

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
    mockConsoleError.mockClear();
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
      expect(mockWriteJson).toHaveBeenCalledWith(
        packageJsonPath,
        { ...mockPackageJson, name: newProjectName },
        { spaces: 2 },
      );
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it("should log an error if package.json does not exist", async () => {
      mockExistsSync.mockReturnValueOnce(false);

      await updateJavascriptProjectName(projectPath, newProjectName);

      expect(mockExistsSync).toHaveBeenCalledWith(packageJsonPath);
      expect(mockReadJson).not.toHaveBeenCalled();
      expect(mockWriteJson).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledOnce();
      expect(mockConsoleError).toHaveBeenCalledWith(expect.any(String));
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
      expect(mockWriteJson).toHaveBeenCalledWith(
        packageJsonPath,
        { ...mockPackageJson, name: newProjectName },
        { spaces: 2 },
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.any(String),
        writeError,
      );
    });
  });
});
