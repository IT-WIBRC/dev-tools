import { vi, describe, it, expect, beforeEach } from "vitest";
import { GitError } from "../../../../src/utils/errors/base.js";
import {
  getRepoNameFromUrl,
  cloneRepo,
  pullRepo,
  isRepoFresh,
} from "../../../../src/utils/cache/git.js";

const mockExeca = vi.hoisted(() => vi.fn());
const mockEnsureDir = vi.hoisted(() => vi.fn());
const mockStat = vi.hoisted(() => vi.fn());
const mockT = vi.hoisted(() => vi.fn((key) => `mocked_t_${key}`));

vi.mock("execa", () => ({
  execa: mockExeca,
}));

vi.mock("#utils/fileSystem.js", () => ({
  default: {
    ensureDir: mockEnsureDir,
    stat: mockStat,
  },
}));

vi.mock("#utils/internationalization/i18n.js", () => ({
  t: mockT,
}));

describe("Git Functions", () => {
  const repoPath = "/temp/repo";
  const url = "https://github.com/test-org/test-repo.git";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRepoNameFromUrl should return the correct repository name from a URL", () => {
    expect(getRepoNameFromUrl(url)).toBe("test-repo");
    expect(getRepoNameFromUrl("https://gitlab.com/test/another-repo")).toBe(
      "another-repo",
    );
  });

  it("cloneRepo should successfully clone a repository", async () => {
    mockExeca.mockResolvedValueOnce(undefined);
    await cloneRepo(url, repoPath);
    expect(mockEnsureDir).toHaveBeenCalledWith(repoPath);
    expect(mockExeca).toHaveBeenCalledWith("git", ["clone", url, "."], {
      cwd: repoPath,
      stdio: "ignore",
    });
  });

  it("cloneRepo should throw a GitError on failure", async () => {
    mockExeca.mockRejectedValueOnce(new Error("Clone failed"));
    await expect(cloneRepo(url, repoPath)).rejects.toThrow(GitError);
    expect(mockT).toHaveBeenCalledWith("cache.clone.fail");
  });

  it("pullRepo should successfully pull a repository", async () => {
    mockExeca.mockResolvedValueOnce(undefined);
    await pullRepo(repoPath);
    expect(mockExeca).toHaveBeenCalledWith("git", ["pull"], {
      cwd: repoPath,
      stdio: "ignore",
    });
  });

  it("pullRepo should throw a GitError on failure", async () => {
    mockExeca.mockRejectedValueOnce(new Error("Pull failed"));
    await expect(pullRepo(repoPath)).rejects.toThrow(GitError);
    expect(mockT).toHaveBeenCalledWith("cache.refresh.fail");
  });

  describe("isRepoFresh", () => {
    it("should return true when strategy is 'never-refresh'", async () => {
      const result = await isRepoFresh(repoPath, "never-refresh");
      expect(result).toBe(true);
      expect(mockStat).not.toHaveBeenCalled();
    });

    it("should return false when strategy is 'always-refresh'", async () => {
      const result = await isRepoFresh(repoPath, "always-refresh");
      expect(result).toBe(false);
      expect(mockStat).not.toHaveBeenCalled();
    });

    it("should return true if the repo is fresh (last pull within 24 hours)", async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      mockStat.mockResolvedValueOnce({ mtime: oneHourAgo });
      const result = await isRepoFresh(repoPath, "daily");
      expect(result).toBe(true);
    });

    it("should return false if the repo is not fresh (last pull over 24 hours ago)", async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      mockStat.mockResolvedValueOnce({ mtime: twoDaysAgo });
      const result = await isRepoFresh(repoPath, "daily");
      expect(result).toBe(false);
    });

    it("should return false if FETCH_HEAD does not exist", async () => {
      const error = new Error("File not found");
      (error as any).code = "ENOENT";
      mockStat.mockRejectedValueOnce(error);
      const result = await isRepoFresh(repoPath, "daily");
      expect(result).toBe(false);
    });
  });
});
