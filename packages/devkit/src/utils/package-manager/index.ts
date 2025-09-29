import {
  JavascriptPackageManagers,
  SupportedPackageManager,
} from "#utils/schema/schema.js";
import { findUp } from "#utils/fs/find-up.js";
import { spawnSync } from "node:child_process";

const cache = new Map<string, SupportedPackageManager | null>();

async function detectPackageManager(): Promise<SupportedPackageManager | null> {
  const cwd = process.cwd();

  if (process.env.npm_config_user_agent) {
    const userAgent = process.env.npm_config_user_agent.split(" ")[0];
    const packageManager = userAgent.substring(0, userAgent.lastIndexOf("/"));

    if (
      Object.values(JavascriptPackageManagers).includes(
        packageManager as SupportedPackageManager,
      )
    ) {
      return packageManager as SupportedPackageManager;
    }
  }

  const lockFiles = [
    { name: "pnpm-lock.yaml", pkg: "pnpm" },
    { name: "yarn.lock", pkg: "yarn" },
    { name: "package-lock.json", pkg: "npm" },
    { name: "bun.lockb", pkg: "bun" },
  ];

  for (const file of lockFiles) {
    const foundPath = await findUp({
      files: [file.name],
      cwd: cwd,
      limit: cwd,
    });

    if (foundPath) {
      return file.pkg as SupportedPackageManager;
    }
  }

  const globalManagers = Object.values(JavascriptPackageManagers);
  for (const manager of globalManagers) {
    try {
      const result = spawnSync(manager, ["--version"], {
        encoding: "utf-8",
        stdio: "pipe",
      });

      if (result.status === 0) {
        return manager as SupportedPackageManager;
      }
      // oxlint-disable-next-line no-unused-vars
    } catch (e) {
      continue;
    }
  }

  return null;
}

export async function getPackageManager(
  forceRefresh = false,
): Promise<SupportedPackageManager | null> {
  const cacheKey = "package-manager";

  if (!forceRefresh && cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const packageManager = await detectPackageManager();

  cache.set(cacheKey, packageManager);

  return packageManager;
}

export function clearPackageManagerCache(): void {
  cache.clear();
}
