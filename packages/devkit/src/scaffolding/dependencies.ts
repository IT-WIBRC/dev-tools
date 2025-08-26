import path from "path";
import { execa } from "execa";
import type { Ora } from "ora";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import type { SupportedJavascriptPackageManager } from "#utils/configs/schema.js";

interface InstallDependenciesOptions {
  projectName: string;
  packageManager: SupportedJavascriptPackageManager;
  spinner: Ora;
}

export async function installDependencies(options: InstallDependenciesOptions) {
  const { projectName, packageManager } = options;
  const projectPath = path.join(process.cwd(), projectName);

  try {
    await execa(packageManager, ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    });
  } catch (error) {
    throw new DevkitError(t("scaffolding.install.fail"), { cause: error });
  }
}
