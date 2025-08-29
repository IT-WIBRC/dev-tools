import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getTemplateFromCache,
  type GetTemplateFromCacheOptions,
} from "../../../../src/utils/cache/index.js";
import * as git from "../../../../src/utils/cache/git.js";
import * as fsManager from "../../../../src/utils/cache/fs-manager.js";
import * as updateProjectName from "../../../../src/utils/update-project-name.js";
import * as templateUtils from "../../../../src/utils/template-utils.js";
import os from "os";
import { mockSpinner } from "../../../../vitest.setup.js";

vi.mock("../../../../src/utils/cache/git.js");
vi.mock("../../../../src/utils/cache/fs-manager.js");
vi.mock("../../../../src/utils/update-project-name.js");
vi.mock("../../../../src/utils/template-utils.js");
vi.mock("os", () => ({
  default: {
    homedir: vi.fn(() => "/home/user"),
  },
}));

describe("getTemplateFromCache", () => {
  const options = {
    url: "https://github.com/test-org/test-repo.git",
    projectName: "my-app",
    spinner: mockSpinner,
    strategy: "daily",
  } as unknown as GetTemplateFromCacheOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpinner.text = "";
    vi.spyOn(git, "getRepoNameFromUrl").mockReturnValue("test-repo");
    vi.spyOn(process, "cwd").mockReturnValue("/current/dir");
  });

  it("should clone and copy a template if it is not in the cache", async () => {
    vi.spyOn(fsManager, "doesRepoExist").mockResolvedValueOnce(false);
    vi.spyOn(git, "cloneRepo").mockResolvedValueOnce(undefined);
    vi.spyOn(templateUtils, "copyJavascriptTemplate").mockResolvedValueOnce(
      undefined,
    );
    vi.spyOn(
      updateProjectName,
      "updateJavascriptProjectName",
    ).mockResolvedValueOnce(undefined);

    await getTemplateFromCache(options);

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.text).toBe("cache.copy.start");
    expect(git.cloneRepo).toHaveBeenCalledWith(
      options.url,
      `${os.homedir()}/.devkit/cache/test-repo`,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith("cache.copy.success");
    expect(templateUtils.copyJavascriptTemplate).toHaveBeenCalledWith(
      `${os.homedir()}/.devkit/cache/test-repo`,
      `/current/dir/${options.projectName}`,
    );
    expect(updateProjectName.updateJavascriptProjectName).toHaveBeenCalledWith(
      `/current/dir/${options.projectName}`,
      options.projectName,
    );
  });

  it("should pull and copy a template if it exists but is not fresh", async () => {
    vi.spyOn(fsManager, "doesRepoExist").mockResolvedValueOnce(true);
    vi.spyOn(git, "isRepoFresh").mockResolvedValueOnce(false);
    vi.spyOn(git, "pullRepo").mockResolvedValueOnce(undefined);

    await getTemplateFromCache(options);

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(git.pullRepo).toHaveBeenCalledWith(
      `${os.homedir()}/.devkit/cache/test-repo`,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith("cache.refresh.success");
  });

  it("should use a template directly if it exists and is fresh", async () => {
    vi.spyOn(fsManager, "doesRepoExist").mockResolvedValueOnce(true);
    vi.spyOn(git, "isRepoFresh").mockResolvedValueOnce(true);

    await getTemplateFromCache(options);

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.info).toHaveBeenCalledWith(
      "cache.use.info- options repoName:test-repo",
    );
    expect(git.pullRepo).not.toHaveBeenCalled();
  });

  it("should fail and throw an error on a cache operation failure", async () => {
    vi.spyOn(fsManager, "doesRepoExist").mockResolvedValueOnce(false);
    vi.spyOn(git, "cloneRepo").mockRejectedValueOnce(
      new Error("Git clone failed"),
    );

    await expect(getTemplateFromCache(options)).rejects.toThrow(
      "Git clone failed",
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith("cache.copy.fail");
  });
});
