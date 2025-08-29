import { vi, describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { DevkitError } from "../../../src/utils/errors/base.js";
import { installDependencies } from "../../../src/scaffolding/dependencies.js";
import { mocktFn, mockExeca } from "../../../vitest.setup.js";

describe("installDependencies", () => {
  const options = {
    projectName: "my-project",
    packageManager: "npm" as any,
    spinner: {
      start: vi.fn(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue("/current/dir");
  });

  it("should successfully install dependencies using the specified package manager", async () => {
    mockExeca.mockResolvedValueOnce(undefined);

    await installDependencies(options);

    const expectedProjectPath = path.join(process.cwd(), options.projectName);

    expect(mockExeca).toHaveBeenCalledWith(
      options.packageManager,
      ["install"],
      {
        cwd: expectedProjectPath,
        stdio: "inherit",
      },
    );
  });

  it("should throw a DevkitError if dependency installation fails", async () => {
    const error = new Error("npm install failed");
    mockExeca.mockRejectedValueOnce(error);

    await expect(installDependencies(options)).rejects.toThrow(DevkitError);
    expect(mocktFn).toHaveBeenCalledWith("scaffolding.install.fail");
  });
});
