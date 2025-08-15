import fs from "fs-extra";
import path from "path";
import { findPackageRoot } from "./file-finder.js";
import { t } from "./i18n.js";
import chalk from "chalk";

export function getProjectVersion(): string {
  try {
    const packageRoot = findPackageRoot();
    if (!packageRoot) {
      throw new Error(t("error.package.root.not_found"));
    }
    const packageJsonPath = path.join(packageRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error(chalk.red(t("error.version.read_fail")), error);
    return "0.0.0";
  }
}
