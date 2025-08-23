import { execaCommand } from "execa";
import type { Ora } from "ora";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import type { SupportedJavascriptPackageManager } from "#utils/configs/schema.js";

interface RunCliCommandOptions {
  command: string;
  projectName: string;
  packageManager: SupportedJavascriptPackageManager;
  spinner: Ora;
}

export async function runCliCommand(options: RunCliCommandOptions) {
  const { command, projectName, packageManager } = options;
  const finalCommand = command.replace("{pm}", packageManager);

  try {
    if (!finalCommand.trim()) {
      throw new DevkitError(
        t("error.invalid.command", { command: finalCommand }),
      );
    }
    await execaCommand(`${finalCommand} ${projectName}`, {
      stdio: "inherit",
    });
  } catch (error: any) {
    const cause = error.stderr || error.message;
    throw new DevkitError(t("scaffolding.run.fail"), { cause });
  }
}
