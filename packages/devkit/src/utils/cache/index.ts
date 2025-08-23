import chalk from "chalk";
import type { Ora } from "ora";
import os from "os";
import path from "path";
import type { CacheStrategy } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import { cloneRepo, pullRepo, isRepoFresh, getRepoNameFromUrl } from "./git.js";
import { doesRepoExist } from "./fs-manager.js";
import { updateJavascriptProjectName } from "../update-project-name.js";
import { copyJavascriptTemplate } from "../template-utils.js";

const CACHE_DIR = path.join(os.homedir(), ".devkit", "cache");

interface CacheOptions {
  spinner: Ora;
  strategy: CacheStrategy;
}

export interface GetTemplateFromCacheOptions extends CacheOptions {
  url: string;
  projectName: string;
}

export async function getTemplateFromCache(
  options: GetTemplateFromCacheOptions,
): Promise<void> {
  const { url, projectName, spinner, strategy } = options;
  const destination = path.join(process.cwd(), projectName);

  try {
    const repoName = getRepoNameFromUrl(url);
    const repoPath = path.join(CACHE_DIR, repoName);

    spinner.text = chalk.bold.cyan(`Checking cache for: ${repoName}...`);
    spinner.start();

    const repoExists = await doesRepoExist(repoPath);

    if (!repoExists) {
      spinner.text = chalk.italic.cyan(t("cache.clone.start", { url }));
      await cloneRepo(url, repoPath);
      spinner.succeed(chalk.bold.green(t("cache.clone.success")));
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

    await copyJavascriptTemplate(repoPath, destination);
    await updateJavascriptProjectName(destination, projectName);

    spinner.succeed(chalk.bold.green(t("cache.copy.success")));
  } catch (error: any) {
    spinner.fail(chalk.red(t("cache.copy.fail")));
    throw error;
  }
}
