import { execute } from "#utils/shell.js";
import { t } from "#utils/i18n/translator.js";
import { GitError } from "#utils/errors/base.js";
import fs from "#utils/fs/file.js";
import path from "path";

export function getRepoNameFromUrl(url: string): string {
  const parts = url.split("/");
  let repoName = parts.pop() || "";
  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }
  return repoName;
}

export async function cloneRepo(url: string, repoPath: string) {
  try {
    await fs.ensureDir(repoPath);
    await execute("git", ["clone", url, "."], {
      cwd: repoPath,
      stdio: "ignore",
    });
  } catch (error: unknown) {
    throw new GitError(t("errors.cache.clone_fail"), url, { cause: error });
  }
}

export async function pullRepo(repoPath: string) {
  try {
    await execute("git", ["pull"], { cwd: repoPath, stdio: "ignore" });
  } catch (error: unknown) {
    throw new GitError(t("errors.cache.refresh_fail"), undefined, {
      cause: error,
    });
  }
}

export async function isRepoFresh(
  repoPath: string,
  strategy: string,
): Promise<boolean> {
  if (strategy === "never-refresh") {
    return true;
  }
  if (strategy === "always-refresh") {
    return false;
  }
  try {
    const stat = await fs.stat(path.join(repoPath, ".git/FETCH_HEAD"));
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - stat.mtime.getTime() < oneDayInMs;
  } catch {
    return false;
  }
}
