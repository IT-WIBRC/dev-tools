import path from "path";
import { execute } from "#utils/shell.js";
import type { Ora } from "ora";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/i18n/translator.js";
import type { SupportedJavascriptPackageManager } from "#utils/schema/schema.js";

interface InstallDependenciesOptions {
  projectName: string;
  packageManager: SupportedJavascriptPackageManager;
  spinner: Ora;
}

export async function installDependencies(options: InstallDependenciesOptions) {
  const { projectName, packageManager } = options;
  const projectPath = path.join(process.cwd(), projectName);

  try {
    await execute(packageManager, ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    });
  } catch (error) {
    throw new DevkitError(t("scaffolding.install.fail"), { cause: error });
  }
}
