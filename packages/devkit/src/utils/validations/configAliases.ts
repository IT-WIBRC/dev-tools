import type { CliConfig } from "#utils/configs/schema.js";

export const configAliases: Record<string, keyof CliConfig["settings"]> = {
  pm: "defaultPackageManager",
  packageManager: "defaultPackageManager",
  cache: "cacheStrategy",
  cacheStrategy: "cacheStrategy",
  language: "language",
  lg: "language",
};
