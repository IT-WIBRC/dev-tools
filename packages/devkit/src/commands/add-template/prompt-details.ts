import chalk from "chalk";
import { input } from "@inquirer/prompts";
import {
  type CliConfig,
  type SupportedProgrammingLanguageValues,
  type SupportedPackageManager,
  type CacheStrategy,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import {
  validateAlias,
  validateDescription,
  validateLocation,
} from "#utils/validations/templates.js";
import type { AddTemplateCommandOptions, AddTemplateSchema } from "./types.js";
import {
  promptForCacheStrategy,
  promptForLanguage,
  promptForPackageManager,
} from "#utils/prompts.js";

export async function promptForTemplateDetails(
  targetConfig: CliConfig,
  cmdOptions: AddTemplateCommandOptions,
): Promise<AddTemplateSchema> {
  const providedAnswers = {
    language: cmdOptions.language,
    templateName: cmdOptions.name,
    description: cmdOptions.description,
    location: cmdOptions.location,
    alias: cmdOptions.alias,
    cacheStrategy: cmdOptions.cacheStrategy,
    packageManager: cmdOptions.packageManager,
  };

  providedAnswers.language = await promptForLanguage(
    true,
    providedAnswers.language as SupportedProgrammingLanguageValues,
  );

  const namePrompt = await input({
    message:
      t("cli.add_template.prompts.template_name") + chalk.red(" (required)"),
    default: providedAnswers.templateName,
    validate: (value) => {
      if (!value) {
        return t("error.template_name_required");
      }
      if (
        !targetConfig.templates[providedAnswers.language!] ||
        targetConfig.templates[providedAnswers.language!].templates[value]
      ) {
        return t("error.template.exists", { template: value });
      }
      return true;
    },
  });

  providedAnswers.templateName = namePrompt;

  const descriptionPrompt = await input({
    message:
      t("cli.add_template.prompts.description") + chalk.red(" (required)"),
    default: providedAnswers.description,
    validate: (value) => {
      try {
        validateDescription(value);
        return true;
      } catch (error) {
        return (error as Error).message;
      }
    },
  });

  providedAnswers.description = descriptionPrompt;

  const locationPrompt = await input({
    message: t("cli.add_template.prompts.location") + chalk.red(" (required)"),
    default: providedAnswers.location,
    validate: (value) => {
      if (!value) {
        return t("error.location_required");
      }
      try {
        validateLocation(value);
        return true;
      } catch (error) {
        return (error as Error).message;
      }
    },
  });

  providedAnswers.location = locationPrompt;

  const aliasPrompt = await input({
    message: t("cli.add_template.prompts.alias") + chalk.gray(" (optional)"),
    default: providedAnswers.alias,
    validate: (value) => {
      if (!value) return true;
      try {
        validateAlias(value);
        return true;
      } catch (error) {
        return (error as Error).message;
      }
    },
  });

  providedAnswers.alias = aliasPrompt;

  providedAnswers.cacheStrategy =
    (await promptForCacheStrategy(
      false,
      providedAnswers.cacheStrategy as CacheStrategy,
    )) || undefined;

  providedAnswers.packageManager =
    (await promptForPackageManager(
      false,
      providedAnswers.packageManager as SupportedPackageManager,
    )) || undefined;

  return {
    description: providedAnswers.description!,
    alias: providedAnswers.alias,
    cacheStrategy: providedAnswers.cacheStrategy || undefined,
    packageManager: providedAnswers.packageManager || undefined,
    language: providedAnswers.language!,
    templateName: providedAnswers.templateName!,
    location: providedAnswers.location!,
  };
}
