import fs from "#utils/fs/file.js";
import path from "path";
import { findPackageRoot } from "#utils/fs/finder.js";
import { t } from "#utils/i18n/translator.js";
import { logger } from "#utils/logger.js";
import { FILE_NAMES } from "#utils/schema/schema.js";

export async function getProjectVersion(): Promise<string> {
  try {
    const packageRoot = await findPackageRoot();
    if (!packageRoot) {
      throw new Error(t("errors.system.package_root_not_found"));
    }

    const packageJsonPath = path.join(packageRoot, FILE_NAMES.packageJson);
    const packageJson = await fs.readJson(packageJsonPath);

    return packageJson.version;
  } catch (error) {
    const errorMessage = t("errors.system.version_read_fail");

    if (error instanceof Error) {
      logger.error(`${errorMessage}: ${error.message}`, "INFO");
    } else {
      logger.error(errorMessage, "INFO");
    }

    if (error instanceof Error && error.stack) {
      logger.dimmed(error.stack);
    }

    return "0.0.0";
  }
}
