import { type CliConfig } from "#utils/configs/schema.js";
import { t } from "#utils/internationalization/i18n.js";
import {
  handleNonInteractiveSettingsUpdate,
  handleNonInteractiveTemplateUpdate,
} from "./logic.js";
import { select, input } from "@inquirer/prompts";
import {
  promptForCacheStrategy,
  promptForLanguage,
  promptForPackageManager,
} from "#utils/prompts.js";
import chalk from "chalk";

const SETTINGS_CHOICES = [
  {
    name: `pm (${chalk.gray("package manager")})`,
    value: "packageManager",
  },
  {
    name: `cache (${chalk.gray("cache strategy")})`,
    value: "cacheStrategy",
  },
  {
    name: `lg (${chalk.gray("language")})`,
    value: "language",
  },
];

async function handleInteractiveSettings(
  config: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  const settingKey = await select({
    message: t("config.interactive.prompt_setting_key"),
    choices: SETTINGS_CHOICES,
  });

  console.log(settingKey);
  let newValue;
  switch (settingKey) {
    case "packageManager":
      newValue = await promptForPackageManager(true);
      break;
    case "cacheStrategy":
      newValue = await promptForCacheStrategy(true);
      break;
    case "language":
      newValue = await promptForLanguage();
      break;
    default:
      newValue = await input({
        message: t("config.interactive.prompt_new_value", {
          key: settingKey,
        }),
      });
      break;
  }

  await handleNonInteractiveSettingsUpdate(settingKey, newValue!, isGlobal);
  console.log(t("config.set.success"));
}

async function handleInteractiveTemplates(
  config: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  const language = await promptForLanguage(true, undefined);

  const templates = Object.keys(config.templates[language]?.templates || {});
  const templateName = await select({
    message: t("config.interactive.prompt_template_name"),
    choices: templates.map((key) => ({ name: key, value: key })),
  });

  const property = await select({
    message: t("config.interactive.prompt_template_property"),
    choices: [
      { name: "description", value: "description" },
      { name: "location", value: "location" },
      { name: "alias", value: "alias" },
      { name: "cacheStrategy", value: "cacheStrategy" },
      { name: "packageManager", value: "packageManager" },
    ],
  });

  let newValue;
  switch (property) {
    case "cacheStrategy":
      newValue = await promptForCacheStrategy(true);
      break;
    case "packageManager":
      newValue = await promptForPackageManager(true);
      break;
    default:
      newValue = await input({
        message: t("config.interactive.prompt_new_value", {
          key: property,
        }),
      });
      break;
  }

  const updates: Record<string, string> = { [property]: newValue! };
  await handleNonInteractiveTemplateUpdate(
    language,
    templateName,
    updates,
    isGlobal,
  );
  console.log(t("config.update.success", { templateName }));
}

export async function handleInteractiveConfig(
  config: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  const action = await select({
    message: t("config.interactive.prompt_action"),
    choices: [
      { name: t("config.interactive.action.settings"), value: "settings" },
      { name: t("config.interactive.action.templates"), value: "templates" },
    ],
  });

  if (action === "settings") {
    await handleInteractiveSettings(config, isGlobal);
  } else if (action === "templates") {
    await handleInteractiveTemplates(config, isGlobal);
  }
}
