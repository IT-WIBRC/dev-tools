import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getTemplateFromCache,
  type GetTemplateFromCacheOptions,
} from "../../../../src/core/cache/index.js";
import * as git from "../../../../src/core/cache/git.js";
import * as fsManager from "../../../../src/core/cache/fs-manager.js";
import * as updateProjectName from "../../../../src/core/template/update-project-name.js";
import * as templateUtils from "../../../../src/core/template/template-utils.js";
import os from "os";
import { mockSpinner } from "../../../../vitest.setup.js";

vi.mock("../../../../src/core/cache/git.js");
vi.mock("../../../../src/core/cache/fs-manager.js");
vi.mock("../../../../src/core/template/update-project-name.js");
vi.mock("../../../../src/core/template/template-utils.js");
vi.mock("os", () => ({
  default: {
    homedir: vi.fn(() => "/home/user"),
  },
}));

const REFRESH_SUCCESS_KEY = "messages.success.template_updated";
const CLONE_SUCCESS_KEY = "messages.success.template_added";
const USE_INFO_KEY = "messages.status.cache_use_info";
const COPY_START_KEY = "messages.status.cache_copy_start";
const COPY_SUCCESS_KEY = "messages.success.new_project";
const COPY_FAIL_KEY = "errors.cache.copy_fail";

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
    expect(mockSpinner.text).toBe(COPY_START_KEY);
    expect(git.cloneRepo).toHaveBeenCalledWith(
      options.url,
      `${os.homedir()}/.devkit/cache/test-repo`,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(CLONE_SUCCESS_KEY);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(COPY_SUCCESS_KEY);
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
    expect(mockSpinner.succeed).toHaveBeenCalledWith(REFRESH_SUCCESS_KEY);
  });

  it("should use a template directly if it exists and is fresh", async () => {
    vi.spyOn(fsManager, "doesRepoExist").mockResolvedValueOnce(true);
    vi.spyOn(git, "isRepoFresh").mockResolvedValueOnce(true);

    await getTemplateFromCache(options);

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.info).toHaveBeenCalledWith(
      `${USE_INFO_KEY}- options repoName:test-repo`,
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
    expect(mockSpinner.fail).toHaveBeenCalledWith(COPY_FAIL_KEY);
  });
});
