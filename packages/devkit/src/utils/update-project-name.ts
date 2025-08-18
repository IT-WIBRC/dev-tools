import fs from "fs-extra";
import path from "path";
import { FILE_NAMES } from "./configs/schema";
import { t } from "#utils/internationalization/i18n.js";
import chalk from "chalk";

export async function updateJavascriptProjectName(
  projectPath: string,
  newProjectName: string,
): Promise<void> {
  const packageJsonPath = path.join(projectPath, FILE_NAMES.common.packageJson);

  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.redBright(t("error.package.file_not_found")));
    return;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = newProjectName;

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  } catch (error) {
    console.error(
      chalk.red(t("error.package.failed_to_update_project_name")),
      error,
    );
  }
}
