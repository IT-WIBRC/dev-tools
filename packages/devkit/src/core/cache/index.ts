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
        logger.colors.italic(t("messages.status.cache_clone_start", { url })),
      );
      await cloneRepo(url, repoPath);
      spinner.succeed(
        logger.colors.green(
          logger.colors.bold(t("messages.success.template_added")),
        ),
      );
    } else {
      const fresh = await isRepoFresh(repoPath, strategy);
      if (!fresh) {
        spinner.text = logger.colors.cyan(
          t("messages.status.cache_refresh_start"),
        );
        await pullRepo(repoPath);
        spinner.succeed(
          logger.colors.green(t("messages.success.template_updated")),
        );
      } else {
        spinner.info(
          logger.colors.yellow(
            t("messages.status.cache_use_info", { repoName }),
          ),
        );
      }
    }

    spinner.text = logger.colors.cyan(t("messages.status.cache_copy_start"));

    await copyJavascriptTemplate(repoPath, destination);
    await updateJavascriptProjectName(destination, projectName);

    spinner.succeed(
      logger.colors.green(
        logger.colors.bold(t("messages.success.new_project")),
      ),
    );
  } catch (error: unknown) {
    spinner.fail(logger.colors.red(t("errors.cache.copy_fail")));

    const message = t("errors.cache.copy_fail");
    if (error instanceof Error) {
      logger.error(`${message}: ${error.message}`, "CACHE");
    } else {
      logger.error(message, "CACHE");
    }

    throw error;
  }
}
