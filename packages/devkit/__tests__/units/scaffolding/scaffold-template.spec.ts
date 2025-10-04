import { vi, describe, it, expect, beforeEach } from "vitest";
import { scaffoldTemplate } from "../../../src/scaffolding/scaffold-template.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner } from "../../../vitest.setup.js";

const { mockRunCliCommand, mockGetTemplateFromCache, mockCopyLocalTemplate } =
  vi.hoisted(() => ({
    mockRunCliCommand: vi.fn(),
    mockGetTemplateFromCache: vi.fn(),
    mockCopyLocalTemplate: vi.fn(),
  }));

vi.mock("#scaffolding/cli-runner.js", () => ({
  runCliCommand: mockRunCliCommand,
}));

vi.mock("#core/cache/index.js", () => ({
  getTemplateFromCache: mockGetTemplateFromCache,
}));

vi.mock("#scaffolding/local-template.js", () => ({
  copyLocalTemplate: mockCopyLocalTemplate,
}));

describe("scaffoldTemplate", () => {
  const projectName = "my-test-app";
  const packageManager = "npm";
  const cacheStrategy = "daily";
  const spinner = mockSpinner;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run the official CLI command and return isOfficialCli: true", async () => {
    const templateConfig = { location: "{pm} create vue" };

    const result = await scaffoldTemplate(
      projectName,
      templateConfig,
      packageManager,
      cacheStrategy,
      spinner,
    );

    expect(mockRunCliCommand).toHaveBeenCalledWith({
      command: templateConfig.location,
      projectName,
      packageManager,
      spinner,
    });
    expect(mockGetTemplateFromCache).not.toHaveBeenCalled();
    expect(mockCopyLocalTemplate).not.toHaveBeenCalled();

    expect(result).toEqual({ isOfficialCli: true, projectDirCreated: false });

    expect(spinner.text).not.toBe("messages.scaffolding.copy_start");
    expect(spinner.stop).toHaveBeenCalled();
  });

  it("should get the template from cache and return projectDirCreated: true", async () => {
    const templateConfig = { location: "https://github.com/repo/test.git" };

    const result = await scaffoldTemplate(
      projectName,
      templateConfig,
      packageManager,
      cacheStrategy,
      spinner,
    );

    expect(mockGetTemplateFromCache).toHaveBeenCalledWith({
      url: templateConfig.location,
      projectName,
      spinner,
      strategy: cacheStrategy,
    });
    expect(mockRunCliCommand).not.toHaveBeenCalled();
    expect(mockCopyLocalTemplate).not.toHaveBeenCalled();

    expect(result).toEqual({ isOfficialCli: false, projectDirCreated: true });

    expect(spinner.stop).not.toHaveBeenCalled();
    expect(spinner.succeed).not.toHaveBeenCalled();
  });

  it("should get template from cache for a git@ url", async () => {
    const templateConfig = { location: "git@github.com:repo/test.git" };

    await scaffoldTemplate(
      projectName,
      templateConfig,
      packageManager,
      cacheStrategy,
      spinner,
    );

    expect(mockGetTemplateFromCache).toHaveBeenCalledWith(
      expect.objectContaining({ url: templateConfig.location }),
    );
  });

  it("should copy the local template and return projectDirCreated: true", async () => {
    const templateConfig = { location: "./templates/local" };

    const result = await scaffoldTemplate(
      projectName,
      templateConfig,
      packageManager,
      cacheStrategy,
      spinner,
    );

    expect(mockCopyLocalTemplate).toHaveBeenCalledWith({
      sourcePath: templateConfig.location,
      projectName,
      spinner,
    });
    expect(mockRunCliCommand).not.toHaveBeenCalled();
    expect(mockGetTemplateFromCache).not.toHaveBeenCalled();

    expect(result).toEqual({ isOfficialCli: false, projectDirCreated: true });

    expect(spinner.text).toBe("messages.scaffolding.copy_start");
    expect(spinner.succeed).toHaveBeenCalled();
  });

  it("should throw an exception if any underlying scaffolding call fails", async () => {
    const templateConfig = { location: "http://invalid-url" };
    const error = new DevkitError("Cache download failed");

    vi.mocked(mockGetTemplateFromCache).mockRejectedValueOnce(error);

    await expect(
      scaffoldTemplate(
        projectName,
        templateConfig,
        packageManager,
        cacheStrategy,
        spinner,
      ),
    ).rejects.toThrow(error);

    expect(spinner.fail).not.toHaveBeenCalled();
  });
});
