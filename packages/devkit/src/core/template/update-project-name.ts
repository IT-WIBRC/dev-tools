import fs from "#utils/fs/file.js";
import path from "path";
import { FILE_NAMES } from "#utils/schema/schema.js";
import { t } from "#utils/i18n/translator.js";
import { logger } from "#utils/logger.js";

export async function updateJavascriptProjectName(
  projectPath: string,
  newProjectName: string,
): Promise<void> {
  const packageJsonPath = path.join(projectPath, FILE_NAMES.packageJson);

  if (!fs.existsSync(packageJsonPath)) {
    logger.error(t("error.package.file_not_found"), "TEMPL");
    return;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = newProjectName;

    await fs.writeJson(packageJsonPath, packageJson);
  } catch (error) {
    const errorMessage = t("error.package.failed_to_update_project_name");

    if (error instanceof Error) {
      logger.error(`${errorMessage}: ${error.message}`, "TEMPL");
    } else {
      logger.error(errorMessage, "TEMPL");
    }

    if (error instanceof Error && error.stack) {
      logger.dimmed(error.stack);
    }
  }
}
