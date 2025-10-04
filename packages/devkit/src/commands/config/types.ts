import {
  type CacheStrategy,
  type SupportedPackageManager,
  type SupportedProgrammingLanguageKeys,
} from "#utils/schema/schema.js";

export type ConfigCommandOptions = {
  global?: boolean;
};

export type AddCommandOptions = {
  description: string;
  location: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
  global?: boolean;
};

export type RemoveCommandOptions = {
  global?: boolean;
};

export type AddTemplateSchema = {
  language: SupportedProgrammingLanguageKeys;
  templateName: string;
  description: string;
  location: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
};

export type UpdateCommandOptions = {
  newName?: string;
  description?: string;
  alias?: string;
  location?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
  global?: boolean;
};

export type ListCommandOptions = {
  global?: boolean;
  all?: boolean;
};
