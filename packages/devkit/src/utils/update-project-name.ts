import fs from "#utils/fileSystem.js";
import path from "path";
import { FILE_NAMES } from "./configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import chalk from "chalk";

export async function updateJavascriptProjectName(
  projectPath: string,
  newProjectName: string,
): Promise<void> {
  const packageJsonPath = path.join(projectPath, FILE_NAMES.packageJson);

  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.redBright(t("error.package.file_not_found")));
    return;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = newProjectName;

    await fs.writeJson(packageJsonPath, packageJson);
  } catch (error) {
    console.error(
      chalk.red(t("error.package.failed_to_update_project_name")),
      error,
    );
  }
}
