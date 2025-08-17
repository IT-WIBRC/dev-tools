import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import type { Ora } from "ora";
import os from "os";
import chalk from "chalk";
import type { CacheStrategy } from "../config.js";
import { t } from "./i18n.js";
import { GitError } from "./errors/errors.js";

const CACHE_DIR = path.join(os.homedir(), ".devkit", "cache");

interface CacheOptions {
  spinner: Ora;
  strategy: CacheStrategy;
}

export interface GetTemplateFromCacheOptions extends CacheOptions {
  url: string;
  projectName: string;
}

function getRepoNameFromUrl(url: string): string {
  const parts = url.split("/");
  let repoName = parts.pop() || "";
  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }
  return repoName;
}

async function cloneRepo(url: string, repoPath: string) {
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

async function pullRepo(repoPath: string) {
  try {
    await execa("git", ["pull"], { cwd: repoPath, stdio: "ignore" });
  } catch (error) {
    throw new GitError(t("cache.refresh.fail"), undefined, { cause: error });
  }
}

async function isRepoFresh(
  repoPath: string,
  strategy: CacheStrategy,
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

export async function getTemplateFromCache(
  options: GetTemplateFromCacheOptions,
): Promise<void> {
  const { url, projectName, spinner, strategy } = options;
  const destination = path.join(process.cwd(), projectName);

  try {
    const repoName = getRepoNameFromUrl(url);
    const repoPath = path.join(CACHE_DIR, repoName);

    spinner.text = chalk.cyan(`Checking cache for: ${repoName}...`);
    spinner.start();

    const repoExists = await fs.promises
      .stat(repoPath)
      .then(() => true)
      .catch(() => false);

    if (!repoExists) {
      spinner.text = chalk.cyan(t("cache.clone.start", { url }));
      await cloneRepo(url, repoPath);
      spinner.succeed(chalk.green(t("cache.clone.success")));
    } else {
      const fresh = await isRepoFresh(repoPath, strategy);
      if (!fresh) {
        spinner.text = chalk.cyan(t("cache.refresh.start"));
        await pullRepo(repoPath);
        spinner.succeed(chalk.green(t("cache.refresh.success")));
      } else {
        spinner.info(chalk.yellow(t("cache.use.info", { repoName })));
      }
    }

    spinner.text = chalk.cyan(t("cache.copy.start"));
    await fs.copy(repoPath, destination, {
      filter: (src) => !src.includes(".git"),
    });
    spinner.succeed(chalk.green(t("cache.copy.success")));
  } catch (error: any) {
    spinner.fail(chalk.red(t("cache.copy.fail")));
    throw error;
  }
}
