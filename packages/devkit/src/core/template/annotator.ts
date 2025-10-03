import { readConfigSources } from "../config/loader.js";
import {
  type CliConfig,
  type ReadConfigOptions,
  type TemplateConfig,
} from "#utils/schema/schema.js";

type TemplateSource = "default" | "global" | "local";

export type AnnotatedTemplate = TemplateConfig & {
  _source: TemplateSource;
  _language: string;
  _name: string;
};

type ReadConfigOptionsForAnnotation = Omit<ReadConfigOptions, "useFallback"> & {
  includeDefaults: boolean;
};

export async function getAnnotatedTemplates(
  options: ReadConfigOptionsForAnnotation,
): Promise<AnnotatedTemplate[]> {
  const sources = await readConfigSources(options);

  const finalTemplatesMap = new Map<string, AnnotatedTemplate>();

  const processTemplates = (
    config: CliConfig | null,
    sourceTag: TemplateSource,
  ) => {
    if (!config || !config.templates) return;

    for (const [lang, langConfig] of Object.entries(config.templates)) {
      if (!langConfig || !langConfig.templates) continue;

      for (const [name, template] of Object.entries(langConfig.templates)) {
        const key = `${lang}/${name}`;

        const annotated: AnnotatedTemplate = {
          ...template,
          _source: sourceTag,
          _language: lang,
          _name: name,
        };

        finalTemplatesMap.set(key, annotated);
      }
    }
  };

  if (options.includeDefaults && sources.default) {
    processTemplates(sources.default, "default");
  }

  const shouldProcessGlobal =
    sources.global && (options.mergeAll || options.forceGlobal);
  if (shouldProcessGlobal) {
    processTemplates(sources.global, "global");
  }

  const shouldProcessLocal =
    sources.local && (options.mergeAll || !options.forceGlobal);
  if (shouldProcessLocal) {
    processTemplates(sources.local, "local");
  }

  return Array.from(finalTemplatesMap.values());
}
