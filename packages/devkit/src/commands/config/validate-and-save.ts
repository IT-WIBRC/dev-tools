import chalk from "chalk";
import type { Ora } from "ora";
import { saveCliConfig } from "#utils/configs/writer.js";
import { t } from "#utils/internationalization/i18n.js";
import { DevkitError } from "#utils/errors/base.js";
import type { CliConfig, TemplateConfig } from "#utils/configs/schema.js";
import {
  validateLocation,
  validateAlias,
  validateDescription,
} from "#utils/validations/templates.js";
import {
  validatePackageManager,
  validateCacheStrategy,
  validateProgrammingLanguage,
} from "#utils/validations/config.js";
import type { AddTemplateSchema } from "./types.js";

export async function validateAndSaveTemplate(
  templateDetails: AddTemplateSchema,
  targetConfig: CliConfig,
  isGlobal: boolean,
  addSpinner: Ora,
) {
  const {
    description,
    alias,
    cacheStrategy,
    packageManager,
    language,
    templateName,
    location,
  } = templateDetails;

  validateProgrammingLanguage(language);

  const languageConfig = targetConfig.templates[language];
  if (!languageConfig) {
    targetConfig.templates[language] = { templates: {} };
  }

  await validateLocation(location, addSpinner);
  validateDescription(description);

  if (packageManager) {
    validatePackageManager(packageManager);
  }

  if (cacheStrategy) {
    validateCacheStrategy(cacheStrategy);
  }

  if (languageConfig.templates[templateName]) {
    throw new DevkitError(
      t("error.template.exists", { template: templateName }),
    );
  }

  if (alias) {
    validateAlias(alias);
    const aliasExists = Object.values(languageConfig.templates).some(
      (t) => t.alias === alias,
    );
    if (aliasExists) {
      throw new DevkitError(t("error.alias.exists", { alias: alias }));
    }
  }

  const newTemplate: TemplateConfig = {
    description: description,
    location: location,
    alias: alias,
    cacheStrategy: cacheStrategy,
    packageManager: packageManager,
  };

  languageConfig.templates[templateName] = newTemplate;

  await saveCliConfig(targetConfig, isGlobal);

  addSpinner.succeed(
    chalk.green(t("cli.add_template.success", { templateName })),
  );
}
