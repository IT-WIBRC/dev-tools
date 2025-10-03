import { readConfigSources } from "#core/config/loader.js";
import type { TemplateConfig } from "#utils/schema/schema.js";

export async function resolveTemplateNamesForUpdate(
  language: string,
  templateNames: string[],
  isGlobal: boolean,
): Promise<{ resolvedNames: string[]; notFoundNames: string[] }> {
  const sources = await readConfigSources({
    forceGlobal: isGlobal,
    forceLocal: !isGlobal,
  });

  const targetConfig = isGlobal ? sources.global : sources.local;
  const languageTemplates = targetConfig?.templates?.[language]?.templates;

  if (!languageTemplates) {
    if (languageTemplates === undefined) {
      return { resolvedNames: [], notFoundNames: templateNames };
    }
  }

  const templatesMap = Object.entries(languageTemplates || {}).reduce(
    (acc, [name, template]: [string, TemplateConfig]) => {
      acc[name] = name;
      if (template?.alias) {
        acc[template.alias] = name;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  if (templateNames.includes("*")) {
    return {
      resolvedNames: [...new Set(Object.values(templatesMap))],
      notFoundNames: templateNames.filter((name) => name !== "*"),
    };
  }

  const resolvedNames: string[] = [];
  const notFoundNames: string[] = [];

  for (const name of templateNames) {
    const actualName = templatesMap[name];
    if (actualName) {
      if (!resolvedNames.includes(actualName)) {
        resolvedNames.push(actualName);
      }
    } else {
      notFoundNames.push(name);
    }
  }

  return { resolvedNames, notFoundNames };
}
