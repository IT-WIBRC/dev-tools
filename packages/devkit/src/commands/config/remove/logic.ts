import { t } from "#utils/i18n/translator.js";
import { DevkitError } from "#utils/errors/base.js";
import { readConfigSources } from "#core/config/loader.js";
import { saveGlobalConfig, saveLocalConfig } from "#core/config/writer.js";
import { type CliConfig, type TemplateConfig } from "#utils/schema/schema.js";
import { validateProgrammingLanguage } from "#utils/validations/config.js";

export async function saveConfig(
  targetConfig: CliConfig,
  isGlobal: boolean,
): Promise<void> {
  if (isGlobal) {
    await saveGlobalConfig(targetConfig);
  } else {
    await saveLocalConfig(targetConfig);
  }
}

export async function getTargetConfigForModification(
  isGlobal: boolean,
): Promise<CliConfig> {
  const sources = await readConfigSources({
    forceGlobal: isGlobal,
    forceLocal: !isGlobal,
  });

  const targetConfig = isGlobal ? sources.global : sources.local;

  if (!targetConfig) {
    if (isGlobal) {
      throw new DevkitError(t("errors.config.global_not_found"));
    } else {
      throw new DevkitError(t("errors.config.local_not_found"));
    }
  }

  return targetConfig;
}

export function resolveTemplateNames(
  templateNames: string[],
  templatesMap: Record<string, string>,
): { templatesToActOn: string[]; notFound: string[] } {
  const actualTemplateNames = Object.values(templatesMap);
  const uniqueActualTemplateNames = [...new Set(actualTemplateNames)];

  if (templateNames.includes("*")) {
    return {
      templatesToActOn: uniqueActualTemplateNames,
      notFound:
        templateNames.length > 1
          ? templateNames.filter((name) => name !== "*")
          : [],
    };
  }

  const templatesToActOn: string[] = [];
  const notFound: string[] = [];

  for (const name of templateNames) {
    const actualName = templatesMap[name];
    if (actualName) {
      if (!templatesToActOn.includes(actualName)) {
        templatesToActOn.push(actualName);
      }
    } else {
      notFound.push(name);
    }
  }

  return { templatesToActOn, notFound };
}

export async function getTemplateNamesToActOn(
  language: string,
  templateNames: string[],
  isGlobal: boolean,
): Promise<{
  targetConfig: CliConfig;
  languageTemplates: Record<string, TemplateConfig>;
  templatesToActOn: string[];
  notFound: string[];
}> {
  validateProgrammingLanguage(language);

  const targetConfig = await getTargetConfigForModification(isGlobal);

  const languageTemplates = targetConfig?.templates?.[language]?.templates;

  if (!languageTemplates) {
    throw new DevkitError(
      t("errors.template.language_not_found", { language: language }),
    );
  }

  const templatesMap = Object.entries(languageTemplates).reduce(
    (acc, [name, template]) => {
      acc[name] = name;
      if (template?.alias) {
        acc[template.alias] = name;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  const { templatesToActOn, notFound } = resolveTemplateNames(
    templateNames,
    templatesMap,
  );

  return { targetConfig, languageTemplates, templatesToActOn, notFound };
}
