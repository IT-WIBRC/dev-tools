import { execa } from "execa";
import { t } from "#utils/internationalization/i18n.js";
import { GitError } from "#utils/errors/base.js";
import fs from "fs-extra";
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
    await execa("git", ["clone", url, "."], {
      cwd: repoPath,
      stdio: "ignore",
    });
  } catch (error) {
    throw new GitError(t("cache.clone.fail"), url, { cause: error });
  }
}

export async function pullRepo(repoPath: string) {
  try {
    await execa("git", ["pull"], { cwd: repoPath, stdio: "ignore" });
  } catch (error) {
    throw new GitError(t("cache.refresh.fail"), undefined, { cause: error });
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
    const stat = await fs.promises.stat(path.join(repoPath, ".git/FETCH_HEAD"));
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - stat.mtime.getTime() < oneDayInMs;
  } catch {
    return false;
  }
}
