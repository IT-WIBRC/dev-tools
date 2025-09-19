import {
  type SupportedProgrammingLanguageValues,
  type CacheStrategy,
  type SupportedPackageManager,
} from "#utils/configs/schema.js";

export type AddTemplateCommandOptions = {
  global: boolean;
  interactive: boolean;
  language?: SupportedProgrammingLanguageValues;
  name?: string;
  description?: string;
  location?: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
};

export type AddTemplateSchema = {
  description: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
  language: SupportedProgrammingLanguageValues;
  templateName: string;
  location: string;
};
