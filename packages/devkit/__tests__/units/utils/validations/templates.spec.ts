import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  validateAlias,
  validateDescription,
  validateLocation,
} from "../../../../src/utils/validations/templates.js";
import { mockSpinner, mocktFn } from "../../../../vitest.setup.js";
import { DevkitError } from "../../../../src/utils/errors/base.js";

const { mockExeca, mockFs, mockNormalizePath, mockHandleErrorAndExit } =
  vi.hoisted(() => {
    return {
      mockExeca: vi.fn(),
      mockFs: {
        existsSync: vi.fn(),
      },
      mockNormalizePath: vi.fn(),
      mockHandleErrorAndExit: vi.fn(),
    };
  });

vi.mock("execa", () => ({
  execa: mockExeca,
}));

vi.mock("../../../../src/utils/fileSystem.js", () => ({
  default: mockFs,
}));

vi.mock("../../../../src/utils/path/pathNormalizer.js", () => ({
  normalizePath: mockNormalizePath,
}));

vi.mock("#utils/errors/handler.js", () => ({
  handleErrorAndExit: mockHandleErrorAndExit,
}));

describe("Templates Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateLocation", () => {
    describe("GitHub URL validation", () => {
      it("should succeed for a valid GitHub URL", async () => {
        const githubUrl = "https://github.com/user/repo.git";
        mockExeca.mockResolvedValue({ exitCode: 0 });

        await validateLocation(githubUrl, mockSpinner);

        expect(mockExeca).toHaveBeenCalledWith(
          "git",
          ["ls-remote", githubUrl, "HEAD"],
          { reject: false },
        );
        expect(mockSpinner.start).toHaveBeenCalled();
        expect(mockSpinner.succeed).toHaveBeenCalled();
        expect(mockSpinner.fail).not.toHaveBeenCalled();
        expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
      });

      it("should fail for an invalid GitHub URL", async () => {
        const githubUrl = "https://github.com/user/nonexistent.git";
        mockExeca.mockResolvedValue({ exitCode: 1 });

        await validateLocation(githubUrl, mockSpinner);

        expect(mockExeca).toHaveBeenCalledWith(
          "git",
          ["ls-remote", githubUrl, "HEAD"],
          { reject: false },
        );
        expect(mockSpinner.start).toHaveBeenCalled();
        expect(mockSpinner.fail).toHaveBeenCalled();
        expect(mockSpinner.succeed).not.toHaveBeenCalled();
        expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
          new DevkitError(
            mocktFn("error.invalid.github-repo", { url: githubUrl }),
          ),
          mockSpinner,
        );
      });
    });

    describe("Local file path validation", () => {
      it("should succeed for an existing local path", async () => {
        const localPath = "path/to/my/template";
        const normalizedPath = "/absolute/path/to/my/template";

        mockNormalizePath.mockReturnValue(normalizedPath);
        mockFs.existsSync.mockReturnValue(true);

        await validateLocation(localPath, mockSpinner);

        expect(mockNormalizePath).toHaveBeenCalledWith(localPath);
        expect(mockFs.existsSync).toHaveBeenCalledWith(normalizedPath);
        expect(mockHandleErrorAndExit).not.toHaveBeenCalled();
      });

      it("should fail for a non-existent local path", async () => {
        const localPath = "path/to/nonexistent/template";
        const normalizedPath = "/absolute/path/to/nonexistent/template";

        mockNormalizePath.mockReturnValue(normalizedPath);
        mockFs.existsSync.mockReturnValue(false);

        await validateLocation(localPath, mockSpinner);

        expect(mockNormalizePath).toHaveBeenCalledWith(localPath);
        expect(mockFs.existsSync).toHaveBeenCalledWith(normalizedPath);
        expect(mockHandleErrorAndExit).toHaveBeenCalledWith(
          new DevkitError(
            mocktFn("error.invalid.local-path", { path: normalizedPath }),
          ),
          mockSpinner,
        );
      });
    });
  });

  describe("validateAlias", () => {
    it("should not throw an error for a valid alias (2+ chars)", () => {
      expect(() => validateAlias("valid-alias")).not.toThrow();
      expect(() => validateAlias("va")).not.toThrow();
    });

    it("should throw a DevkitError for an empty alias", () => {
      expect(() => validateAlias("")).toThrow(DevkitError);
      expect(() => validateAlias("")).toThrow(
        mocktFn("error.invalid.alias.empty"),
      );
    });

    it("should throw a DevkitError for an alias that is too short (< 2 chars)", () => {
      expect(() => validateAlias("a")).toThrow(DevkitError);
      expect(() => validateAlias("a")).toThrow(
        mocktFn("error.invalid.alias.too-short"),
      );
    });
  });

  describe("validateDescription", () => {
    it("should not throw an error for a valid description (6+ words)", () => {
      const validDescription =
        "This is a valid description with more than five words.";
      expect(() => validateDescription(validDescription)).not.toThrow();
    });

    it("should throw a DevkitError for an empty description", () => {
      expect(() => validateDescription("")).toThrow(DevkitError);
      expect(() => validateDescription("")).toThrow(
        mocktFn("error.invalid.description.empty"),
      );
    });

    it("should throw a DevkitError for a description that is too short (< 10 letters)", () => {
      const shortDescription = "This short";
      expect(() => validateDescription(shortDescription)).toThrow(DevkitError);
      expect(() => validateDescription(shortDescription)).toThrow(
        mocktFn("error.invalid.description.too-short"),
      );
    });
  });
});
