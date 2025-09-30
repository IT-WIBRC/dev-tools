import { executeCommand } from "#utils/shell.js";
import type { Ora } from "ora";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/i18n/translator.js";
import type { SupportedJavascriptPackageManager } from "#utils/schema/schema.js";

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
        t("errors.validation.invalid_command", { command: finalCommand }),
      );
    }
    await executeCommand(`${finalCommand} ${projectName}`, {
      stdio: "inherit",
    });
  } catch (error: any) {
    const cause = error.stderr || error.message;
    throw new DevkitError(t("errors.scaffolding.run_fail"), { cause });
  }
}
