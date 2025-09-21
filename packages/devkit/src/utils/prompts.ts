import { select } from "@inquirer/prompts";
import {
  ProgrammingLanguage,
  type SupportedProgrammingLanguageValues,
  type SupportedPackageManager,
  type CacheStrategy,
  VALID_CACHE_STRATEGIES,
  VALID_PACKAGE_MANAGERS,
} from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import chalk from "chalk";

/**
 * Prompts the user to select a programming language.
 * @param required - If the field is required, shown in the prompt message.
 * @returns The selected programming language value.
 */
export async function promptForLanguage(
  required = true,
  defaultValue?: SupportedProgrammingLanguageValues,
): Promise<SupportedProgrammingLanguageValues> {
  const message = `${t("cli.add_template.prompts.language")} ${
    required ? chalk.red("(required)") : chalk.gray("(optional)")
  }`;
  const choices = Object.values(ProgrammingLanguage).map((lang) => ({
    name: lang,
    value: lang.toLowerCase(),
  }));
  return (await select({
    message,
    choices,
    default: defaultValue,
  })) as SupportedProgrammingLanguageValues;
}

/**
 * Prompts the user to select a package manager.
 * @param required - If the field is required, shown in the prompt message.
 * @returns The selected package manager or null if optional and not chosen.
 */
export async function promptForPackageManager(
  required = true,
  defaultValue?: SupportedPackageManager,
): Promise<SupportedPackageManager | null> {
  const message = `${t(
    "cli.add_template.prompts.package_manager",
  )} ${required ? chalk.red("(required)") : chalk.gray("(optional)")}`;
  return (await select({
    message,
    choices: [
      ...VALID_PACKAGE_MANAGERS.map((pm) => ({ name: pm, value: pm })),
      ...(!required ? [{ name: t("common.none"), value: null }] : []),
    ],
    default: defaultValue,
  })) as SupportedPackageManager | null;
}

/**
 * Prompts the user to select a cache strategy.
 * @param required - If the field is required, shown in the prompt message.
 * @returns The selected cache strategy or null if optional and not chosen.
 */
export async function promptForCacheStrategy(
  required = true,
  defaultValue?: CacheStrategy,
): Promise<CacheStrategy | null> {
  const message = `${t(
    "cli.add_template.prompts.cache_strategy",
  )} ${required ? chalk.red("(required)") : chalk.gray("(optional)")}`;
  return (await select({
    message,
    choices: [
      ...VALID_CACHE_STRATEGIES.map((strategy) => ({
        name: strategy,
        value: strategy,
      })),
      ...(!required ? [{ name: t("common.none"), value: null }] : []),
    ],
    default: defaultValue,
  })) as CacheStrategy | null;
}
