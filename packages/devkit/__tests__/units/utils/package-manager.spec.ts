import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getPackageManager,
  clearPackageManagerCache,
} from "../../../src/utils/files/package-manager.js";

const { mockFindUp, mockBunSpawnSync } = vi.hoisted(() => ({
  mockFindUp: vi.fn(),
  mockBunSpawnSync: vi.fn(),
}));

vi.mock("#utils/files/find-up.js", () => ({
  findUp: mockFindUp,
}));

vi.mock("path", () => ({
  default: {
    resolve: vi.fn((p) => p),
    join: vi.fn((...args) => args.join("/")),
    dirname: vi.fn((p) => p.split("/").slice(0, -1).join("/")),
  },
}));

vi.mock("node:child_process", () => ({
  spawnSync: mockBunSpawnSync,
}));

describe("getPackageManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPackageManagerCache();
    vi.unstubAllGlobals();
    vi.stubGlobal("process", {
      ...process,
      env: {},
    });
  });

  it("should return the package manager from `npm_config_user_agent` environment variable", async () => {
    vi.stubGlobal("process", {
      ...process,
      env: { npm_config_user_agent: "pnpm/8.6.0 bun/1.0.0" },
    });

    const result = await getPackageManager();

    expect(result).toBe("pnpm");
    expect(mockFindUp).not.toHaveBeenCalled();
    expect(mockBunSpawnSync).not.toHaveBeenCalled();
  });

  it("should return the package manager from `yarn.lock` if no env variable is set", async () => {
    mockFindUp.mockImplementation(async ({ files }) => {
      if (files.includes("yarn.lock")) {
        return "yarn.lock";
      }
      return null;
    });

    const result = await getPackageManager();

    expect(result).toBe("yarn");
    expect(mockFindUp).toHaveBeenCalledTimes(2);
    expect(mockBunSpawnSync).not.toHaveBeenCalled();
  });

  it("should return the package manager from `bun.lockb`", async () => {
    mockFindUp.mockImplementation(async ({ files }) => {
      if (files.includes("bun.lockb")) {
        return "bun.lockb";
      }
      return null;
    });

    const result = await getPackageManager();

    expect(result).toBe("bun");
  });

  it("should return the package manager from `pnpm-lock.yaml`", async () => {
    mockFindUp.mockImplementation(async ({ files }) => {
      if (files.includes("pnpm-lock.yaml")) {
        return "pnpm-lock.yaml";
      }
      return null;
    });

    const result = await getPackageManager();

    expect(result).toBe("pnpm");
  });

  it("should return the package manager from `package-lock.json`", async () => {
    mockFindUp.mockImplementation(async ({ files }) => {
      if (files.includes("package-lock.json")) {
        return "package-lock.json";
      }
      return null;
    });

    const result = await getPackageManager();

    expect(result).toBe("npm");
  });

  it("should fall back to a globally available package manager", async () => {
    mockFindUp.mockResolvedValue(null);
    mockBunSpawnSync.mockImplementationOnce((command) => {
      if (command === "bun") {
        return { status: 0 };
      }
      return { status: 1 };
    });

    const result = await getPackageManager();

    expect(result).toBe("bun");
    expect(mockBunSpawnSync).toHaveBeenCalledWith("bun", ["--version"], {
      encoding: "utf-8",
      stdio: "pipe",
    });
  });

  it("should return null if no package manager is found", async () => {
    mockFindUp.mockResolvedValue(null);
    mockBunSpawnSync.mockReturnValue({ status: 1 });

    const result = await getPackageManager();

    expect(result).toBeNull();
  });

  it("should cache the result on the first call", async () => {
    vi.stubGlobal("process", {
      ...process,
      env: { npm_config_user_agent: "pnpm/8.6.0" },
    });

    const firstCall = await getPackageManager();

    vi.stubGlobal("process", {
      ...process,
      env: { npm_config_user_agent: "yarn/1.22.19" },
    });

    const secondCall = await getPackageManager();

    expect(firstCall).toBe("pnpm");
    expect(secondCall).toBe("pnpm");
  });

  it("should bypass the cache and re-detect if `forceRefresh` is true", async () => {
    vi.stubGlobal("process", {
      ...process,
      env: { npm_config_user_agent: "pnpm/8.6.0" },
    });

    await getPackageManager();

    vi.stubGlobal("process", {
      ...process,
      env: { npm_config_user_agent: "yarn/1.22.19" },
    });

    const result = await getPackageManager(true);

    expect(result).toBe("yarn");
  });
});
