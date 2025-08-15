import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import os from "os";
import chalk from "chalk";
import { t } from "./i18n.js";
const CACHE_DIR = path.join(os.homedir(), ".devkit", "cache");
async function cloneRepo(url, repoPath, spinner) {
  spinner.text = chalk.cyan(t("cache.clone.start", { url }));
  spinner.start();
  try {
    await fs.ensureDir(repoPath);
    await execa("git", ["clone", url, "."], {
      cwd: repoPath,
      stdio: "ignore",
    });
    spinner.succeed(chalk.green(t("cache.clone.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("cache.clone.fail")));
    throw error;
  }
}
async function pullRepo(repoPath, spinner) {
  spinner.text = chalk.cyan(t("cache.refresh.start"));
  spinner.start();
  try {
    await execa("git", ["pull"], { cwd: repoPath, stdio: "ignore" });
    spinner.succeed(chalk.green(t("cache.refresh.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("cache.refresh.fail")));
    throw error;
  }
}
async function getCachedTemplatePath(options) {
  const { url, spinner, strategy } = options;
  const repoName = getRepoNameFromUrl(url);
  const repoPath = path.join(CACHE_DIR, repoName);
  const repoExists = fs.existsSync(repoPath);
  if (!repoExists) {
    await cloneRepo(url, repoPath, spinner);
  } else {
    const fresh = await isRepoFresh(repoPath, strategy);
    if (!fresh) {
      await pullRepo(repoPath, spinner);
    } else {
      spinner.info(chalk.yellow(t("cache.use.info", { repoName })));
    }
  }
  return repoPath;
}
function getRepoNameFromUrl(url) {
  const parts = url.split("/");
  let repoName = parts.pop() || "";
  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }
  return repoName;
}
async function isRepoFresh(repoPath, strategy) {
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
export async function getTemplateFromCache(options) {
  const { url, projectName, spinner, strategy } = options;
  const destination = path.join(process.cwd(), projectName);
  const cachedPath = await getCachedTemplatePath({ url, spinner, strategy });
  spinner.text = chalk.cyan(t("cache.copy.start"));
  spinner.start();
  try {
    await fs.copy(cachedPath, destination, {
      filter: (src) => !src.includes(".git"),
    });
    spinner.succeed(chalk.green(t("cache.copy.success")));
  } catch (error) {
    spinner.fail(chalk.red(t("cache.copy.fail")));
    throw error;
  }
}
