import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  scaffoldProject,
  type ScaffoldJavascriptProjectOptions,
} from "../../../src/scaffolding/javascript.js";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { mockSpinner, mockLogger } from "../../../vitest.setup.js";

const { mockScaffoldTemplate, mockInstallDependencies, mockFsRemove } =
  vi.hoisted(() => ({
    mockScaffoldTemplate: vi.fn(),
    mockInstallDependencies: vi.fn(),
    mockFsRemove: vi.fn(),
  }));

vi.mock("../../../src/scaffolding/scaffold-template.js", () => ({
  scaffoldTemplate: mockScaffoldTemplate,
}));

vi.mock("#scaffolding/dependencies.js", () => ({
  installDependencies: mockInstallDependencies,
}));

vi.mock("#utils/fs/file.js", () => ({
  default: {
    remove: mockFsRemove,
  },
}));

describe("scaffoldProject", () => {
  const options = {
    projectName: "my-project",
    packageManager: "npm",
    cacheStrategy: "daily",
    templateConfig: { location: "mock-location" },
  } as ScaffoldJavascriptProjectOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScaffoldTemplate.mockResolvedValue({
      isOfficialCli: false,
      projectDirCreated: false,
    });
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  it("should skip dependency install and success log for official CLI templates", async () => {
    mockScaffoldTemplate.mockResolvedValue({
      isOfficialCli: true,
      projectDirCreated: false,
    });

    await scaffoldProject(options);

    expect(mockScaffoldTemplate).toHaveBeenCalledOnce();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockLogger.log).not.toHaveBeenCalledWith(
      expect.stringContaining("messages.success.scaffolding_complete"),
    );
  });

  it("should run dependency install and log success for custom templates", async () => {
    mockScaffoldTemplate.mockResolvedValue({
      isOfficialCli: false,
      projectDirCreated: true,
    });

    await scaffoldProject(options);

    expect(mockScaffoldTemplate).toHaveBeenCalledOnce();
    expect(mockInstallDependencies).toHaveBeenCalledOnce();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining("messages.success.scaffolding_complete"),
    );
  });

  it("should NOT call fs.remove if projectDirCreated is false on failure", async () => {
    mockScaffoldTemplate.mockRejectedValueOnce(new DevkitError("CLI error"));

    await scaffoldProject(options);

    expect(mockSpinner.fail).toHaveBeenCalledOnce();
    expect(mockFsRemove).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should call fs.remove and log cleanup warning if projectDirCreated is true on failure", async () => {
    mockScaffoldTemplate.mockResolvedValueOnce({
      isOfficialCli: false,
      projectDirCreated: true,
    });
    vi.mocked(mockInstallDependencies).mockRejectedValueOnce(
      new DevkitError("Install error"),
    );

    await scaffoldProject(options);

    expect(mockSpinner.fail).toHaveBeenCalledOnce();
    expect(mockFsRemove).toHaveBeenCalledWith(options.projectName);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warning).toHaveBeenCalledWith(
      expect.stringContaining("messages.status.project_removed"),
    );
  });

  it("should log cleanup failure error if fs.remove itself fails", async () => {
    mockScaffoldTemplate.mockResolvedValueOnce({
      isOfficialCli: false,
      projectDirCreated: true,
    });
    vi.mocked(mockInstallDependencies).mockRejectedValueOnce(
      new DevkitError("Install error"),
    );
    vi.mocked(mockFsRemove).mockRejectedValueOnce(
      new Error("Permissions denied"),
    );

    await scaffoldProject(options);

    expect(mockSpinner.fail).toHaveBeenCalledOnce();
    expect(mockFsRemove).toHaveBeenCalledWith(options.projectName);
    expect(mockLogger.error).toHaveBeenCalledTimes(2);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("errors.scaffolding.fail"),
      "CLEANUP",
    );
  });

  it("should call spinner.fail and console.error on any exception", async () => {
    mockScaffoldTemplate.mockRejectedValueOnce(new Error("Generic error"));
    await scaffoldProject(options);
    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockFsRemove).not.toHaveBeenCalled();
  });
});
