import os from "os";
import path from "path";
import type { CacheStrategy } from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { logger } from "#utils/logger.js";
import type { Ora } from "ora";
import { cloneRepo, pullRepo, isRepoFresh, getRepoNameFromUrl } from "./git.js";
import { doesRepoExist } from "./fs-manager.js";
import { updateJavascriptProjectName } from "../template/update-project-name.js";
import { copyJavascriptTemplate } from "../template/template-utils.js";

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

    spinner.text = logger.colors.cyan(
      logger.colors.bold(`Checking cache for: ${repoName}...`),
    );
    spinner.start();

    const repoExists = await doesRepoExist(repoPath);

    if (!repoExists) {
      spinner.text = logger.colors.cyan(
        logger.colors.italic(t("cache.clone.start", { url })),
      );
      await cloneRepo(url, repoPath);
      spinner.succeed(
        logger.colors.green(logger.colors.bold(t("cache.clone.success"))),
      );
    } else {
      const fresh = await isRepoFresh(repoPath, strategy);
      if (!fresh) {
        spinner.text = logger.colors.cyan(t("cache.refresh.start"));
        await pullRepo(repoPath);
        spinner.succeed(logger.colors.green(t("cache.refresh.success")));
      } else {
        spinner.info(logger.colors.yellow(t("cache.use.info", { repoName })));
      }
    }

    spinner.text = logger.colors.cyan(t("cache.copy.start"));

    await copyJavascriptTemplate(repoPath, destination);
    await updateJavascriptProjectName(destination, projectName);

    spinner.succeed(
      logger.colors.green(logger.colors.bold(t("cache.copy.success"))),
    );
  } catch (error: any) {
    spinner.fail(logger.colors.red(t("cache.copy.fail")));

    const message = t("cache.copy.fail");
    if (error instanceof Error) {
      logger.error(`${message}: ${error.message}`, "CACHE");
    } else {
      logger.error(message, "CACHE");
    }

    throw error;
  }
}
