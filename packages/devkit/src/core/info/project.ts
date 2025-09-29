import fs from "#utils/fs/file.js";
import path from "path";
import { findPackageRoot } from "#utils/fs/finder.js";
import { t } from "#utils/i18n/translator.js";
import chalk from "chalk";
import { FILE_NAMES } from "#utils/schema/schema.js";

export async function getProjectVersion(): Promise<string> {
  try {
    const packageRoot = await findPackageRoot();
    if (!packageRoot) {
      throw new Error(t("error.package.root.not_found"));
    }

    const packageJsonPath = path.join(packageRoot, FILE_NAMES.packageJson);
    const packageJson = await fs.readJson(packageJsonPath);

    return packageJson.version;
  } catch (error) {
    console.error(chalk.red(t("error.version.read_fail")), error);
    return "0.0.0";
  }
}
