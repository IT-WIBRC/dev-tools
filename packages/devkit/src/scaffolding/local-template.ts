import path from "path";
import type { Ora } from "ora";
import { DevkitError } from "#utils/errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import { copyJavascriptTemplate } from "#utils/template-utils.js";
import { updateJavascriptProjectName } from "#utils/update-project-name.js";

interface CopyLocalTemplateOptions {
  sourcePath: string;
  projectName: string;
  spinner: Ora;
}

export async function copyLocalTemplate(options: CopyLocalTemplateOptions) {
  const { sourcePath, projectName } = options;
  const projectPath = path.join(process.cwd(), projectName);

  try {
    let finalSourcePath = sourcePath;

    if (finalSourcePath.startsWith("file://")) {
      finalSourcePath = finalSourcePath.substring(7);
    }

    if (!path.isAbsolute(finalSourcePath)) {
      finalSourcePath = path.join(process.cwd(), finalSourcePath);
    }

    await copyJavascriptTemplate(finalSourcePath, projectPath);
    await updateJavascriptProjectName(projectPath, projectName);
  } catch (error) {
    throw new DevkitError(t("scaffolding.copy.fail"), { cause: error });
  }
}
