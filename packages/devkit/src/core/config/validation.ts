// oxlint-disable no-unused-vars
import { t } from "#utils/i18n/translator.js";
import { DevkitError, ConfigError } from "#utils/errors/base.js";
import {
  validatePackageManager,
  validateCacheStrategy,
  validateLanguage,
  validateProgrammingLanguage,
} from "#utils/validations/config.js";
import { validateDescription } from "#utils/validations/templates.js";
import type { CliConfig } from "#utils/schema/schema.js";
import type { SupportedPackageManager } from "#utils/schema/schema.js";
import type { CacheStrategy } from "#utils/schema/schema.js";

export async function validateConfig(
  config: unknown,
  filePath?: string,
): Promise<CliConfig> {
  const errors: string[] = [];

  if (typeof config !== "object" || config === null) {
    throw new ConfigError(t("errors.config.malformed_root"), filePath);
  }

  const cfg = config as { [key: string]: any };

  if (
    !("settings" in cfg) ||
    typeof cfg.settings !== "object" ||
    cfg.settings === null
  ) {
    errors.push(t("errors.config.missing_or_malformed", { field: "settings" }));
  } else {
    const settings = cfg.settings;

    try {
      if (!settings.defaultPackageManager) throw new DevkitError("");
      validatePackageManager(
        settings.defaultPackageManager as SupportedPackageManager,
      );
    } catch (e: unknown) {
      errors.push(
        t("errors.config.setting_invalid", {
          setting: "defaultPackageManager",
        }),
      );
    }

    try {
      if (!settings.cacheStrategy) throw new DevkitError("");
      validateCacheStrategy(settings.cacheStrategy as CacheStrategy);
    } catch (e: unknown) {
      errors.push(
        t("errors.config.setting_invalid", { setting: "cacheStrategy" }),
      );
    }

    try {
      if (!settings.language) throw new DevkitError("");
      validateLanguage(settings.language as string);
    } catch (e: unknown) {
      errors.push(t("errors.config.setting_invalid", { setting: "language" }));
    }
  }

  if (
    !("templates" in cfg) ||
    typeof cfg.templates !== "object" ||
    cfg.templates === null
  ) {
    errors.push(
      t("errors.config.missing_or_malformed", { field: "templates" }),
    );
  } else {
    const templates = cfg.templates;

    for (const languageKey in templates) {
      const languageBlock = templates[languageKey];

      try {
        validateProgrammingLanguage(languageKey);
      } catch (e: unknown) {
        errors.push(
          t("errors.config.invalid_language_key", { key: languageKey }),
        );
        continue;
      }

      if (
        typeof languageBlock !== "object" ||
        languageBlock === null ||
        !("templates" in languageBlock) ||
        typeof languageBlock.templates !== "object"
      ) {
        errors.push(
          t("errors.config.template_structure_malformed", {
            language: languageKey,
          }),
        );
        continue;
      }

      const templateList = languageBlock.templates;
      for (const templateName in templateList) {
        const template = templateList[templateName];

        if (!template || typeof template !== "object") {
          errors.push(
            t("errors.config.template_malformed", {
              language: languageKey,
              template: templateName,
            }),
          );
          continue;
        }

        if (
          !("location" in template) ||
          typeof template.location !== "string" ||
          !template.location.trim()
        ) {
          errors.push(
            t("errors.config.template_field_missing", {
              language: languageKey,
              template: templateName,
              field: "location",
            }),
          );
        }

        try {
          if (
            !("description" in template) ||
            typeof template.description !== "string"
          ) {
            throw new DevkitError("");
          }
          validateDescription(template.description);
        } catch (e: unknown) {
          errors.push(
            t("errors.config.template_field_missing", {
              language: languageKey,
              template: templateName,
              field: "description",
            }),
          );
        }

        if ("packageManager" in template && template.packageManager) {
          try {
            validatePackageManager(template.packageManager);
          } catch {
            errors.push(
              t("errors.config.template_field_invalid", {
                language: languageKey,
                template: templateName,
                field: "packageManager",
              }),
            );
          }
        }
        if ("cacheStrategy" in template && template.cacheStrategy) {
          try {
            validateCacheStrategy(template.cacheStrategy);
          } catch {
            errors.push(
              t("errors.config.template_field_invalid", {
                language: languageKey,
                template: templateName,
                field: "cacheStrategy",
              }),
            );
          }
        }

        if ("alias" in template && template.alias) {
          if (typeof template.alias !== "string") {
            errors.push(
              t("errors.config.template_field_invalid", {
                language: languageKey,
                template: templateName,
                field: "alias",
              }),
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    const errorDetails = errors.map((e) => `  - ${e}`).join("\n");

    throw new ConfigError(
      t("errors.config.validation_failed", {
        details: errorDetails,
      }),
      filePath,
    );
  }

  return config as CliConfig;
}
