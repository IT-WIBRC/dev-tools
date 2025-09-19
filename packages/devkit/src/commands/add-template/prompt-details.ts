import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import {
  type CliConfig,
  ProgrammingLanguage,
  type SupportedProgrammingLanguageValues,
  type SupportedPackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import {
  validateAlias,
  validateDescription,
  validateLocation,
} from "#utils/validations/templates.js";
import type { AddTemplateCommandOptions, AddTemplateSchema } from "./types.js";

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

  const languagePrompt = (await select({
    message: t("cli.add_template.prompts.language") + chalk.red(" (required)"),
    choices: Object.values(ProgrammingLanguage).map((lang) => ({
      name: lang,
      value: lang.toLowerCase(),
    })),
    default: providedAnswers.language,
  })) as SupportedProgrammingLanguageValues;

  providedAnswers.language = languagePrompt;

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

  const cacheStrategyPrompt = (await select({
    message:
      t("cli.add_template.prompts.cache_strategy") + chalk.gray(" (optional)"),
    choices: [
      ...VALID_CACHE_STRATEGIES.map((strategy) => ({
        name: strategy,
        value: strategy,
      })),
      { name: t("common.none"), value: null },
    ],
    default: providedAnswers.cacheStrategy,
  })) as CacheStrategy | null;

  providedAnswers.cacheStrategy = cacheStrategyPrompt || undefined;

  const packageManagerPrompt = (await select({
    message:
      t("cli.add_template.prompts.package_manager") + chalk.gray(" (optional)"),
    choices: [
      ...VALID_PACKAGE_MANAGERS.map((pm) => ({
        name: pm,
        value: pm,
      })),
      { name: t("common.none"), value: null },
    ],
    default: providedAnswers.packageManager,
  })) as SupportedPackageManager | null;

  providedAnswers.packageManager = packageManagerPrompt || undefined;

  return {
    description: providedAnswers.description!,
    alias: providedAnswers.alias,
    cacheStrategy: providedAnswers.cacheStrategy,
    packageManager: providedAnswers.packageManager,
    language: providedAnswers.language!,
    templateName: providedAnswers.templateName!,
    location: providedAnswers.location!,
  };
}
