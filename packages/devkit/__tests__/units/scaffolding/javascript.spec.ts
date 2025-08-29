import { vi, describe, it, expect, beforeEach } from "vitest";
import { scaffoldProject } from "../../../src/scaffolding/javascript.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner } from "../../../vitest.setup.js";

const {
  mockRunCliCommand,
  mockInstallDependencies,
  mockCopyLocalTemplate,
  mockGetTemplateFromCache,
} = vi.hoisted(() => ({
  mockRunCliCommand: vi.fn(),
  mockInstallDependencies: vi.fn(),
  mockGetTemplateFromCache: vi.fn(),
  mockCopyLocalTemplate: vi.fn(),
}));

vi.mock("#scaffolding/cli-runner.js", () => ({
  runCliCommand: mockRunCliCommand,
}));

vi.mock("#utils/cache/index.js", () => ({
  getTemplateFromCache: mockGetTemplateFromCache,
}));

vi.mock("#scaffolding/local-template.js", () => ({
  copyLocalTemplate: mockCopyLocalTemplate,
}));

vi.mock("#scaffolding/dependencies.js", () => ({
  installDependencies: mockInstallDependencies,
}));

describe("scaffoldProject", () => {
  const options = {
    projectName: "my-project",
    packageManager: "npm",
    cacheStrategy: "daily",
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should run official CLI command for a {pm} template", async () => {
    const templateConfig = { location: "{pm} create vue" };
    await scaffoldProject({ ...options, templateConfig });
    expect(mockRunCliCommand).toHaveBeenCalledOnce();
    expect(mockRunCliCommand).toHaveBeenCalledWith({
      command: "{pm} create vue",
      projectName: options.projectName,
      packageManager: options.packageManager,
      spinner: mockSpinner,
    });
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it("should get template from cache for a remote Git URL", async () => {
    const templateConfig = { location: "https://github.com/repo/test.git" };
    await scaffoldProject({ ...options, templateConfig });
    expect(mockGetTemplateFromCache).toHaveBeenCalledWith({
      url: templateConfig.location,
      projectName: options.projectName,
      spinner: mockSpinner,
      strategy: options.cacheStrategy,
    });
    expect(mockInstallDependencies).toHaveBeenCalled();
  });

  it("should copy local template for a relative path", async () => {
    const templateConfig = { location: "./templates/local" };
    await scaffoldProject({ ...options, templateConfig });
    expect(mockCopyLocalTemplate).toHaveBeenCalledWith({
      sourcePath: templateConfig.location,
      projectName: options.projectName,
      spinner: mockSpinner,
    });
    expect(mockInstallDependencies).toHaveBeenCalled();
  });

  it("should call spinner.fail and console.error on any exception", async () => {
    const templateConfig = { location: "http://invalid-url" };
    vi.mocked(mockGetTemplateFromCache).mockRejectedValueOnce(
      new DevkitError("Test error"),
    );
    await scaffoldProject({ ...options, templateConfig });
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("should log success messages and next steps for non-CLI templates", async () => {
    const templateConfig = { location: "http://example.com" };
    await scaffoldProject({ ...options, templateConfig });
    expect(mockInstallDependencies).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("scaffolding.complete.success");
  });
});
