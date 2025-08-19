import type { Command } from "commander";

export const ProgrammingLanguage = {
  Javascript: "Javascript",
} as const;

export const JavascriptPackageManagers = {
  Bun: "bun",
  Npm: "npm",
  Yarn: "yarn",
  Deno: "deno",
  Pnpm: "pnpm",
} as const;

export const PackageManagers = {
  ...JavascriptPackageManagers,
} as const;

export type PackageManager =
  (typeof PackageManagers)[keyof typeof PackageManagers];

export type SupportedJavascriptPackageManager = ValuesOf<
  typeof JavascriptPackageManagers
>;
type SupportedPackageManager = ValuesOf<typeof PackageManagers>;

export type ValuesOf<T> = T[keyof T];
export type LowercaseValues<T extends string> =
  T extends `${infer U}.${infer E}`
    ? `${Lowercase<U>}${E}`
    : T extends `${infer U}`
      ? Lowercase<U>
      : T;

export const TextLanguages = {
  English: "en",
  French: "fr",
} as const;
export type TextLanguageValues = ValuesOf<typeof TextLanguages>;
// oxlint-disable-next-line no-useless-spread
export const SUPPORTED_LANGUAGES = [...Object.values(TextLanguages)] as const;

export interface TemplateConfig {
  description: string;
  location: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: SupportedPackageManager;
}

export interface LanguageConfig {
  templates: { [key: string]: TemplateConfig };
}

export const VALID_CACHE_STRATEGIES = [
  "always-refresh",
  "never-refresh",
  "daily",
] as const;
export type CacheStrategy = (typeof VALID_CACHE_STRATEGIES)[number];

export type SupportedProgrammingLanguageValues = LowercaseValues<
  ValuesOf<typeof ProgrammingLanguage>
>;

export interface CliConfig {
  templates: {
    [key in SupportedProgrammingLanguageValues]?: LanguageConfig;
  } & {
    [key: string]: LanguageConfig;
  };
  settings: {
    defaultPackageManager: SupportedPackageManager;
    cacheStrategy?: CacheStrategy;
    language: TextLanguageValues;
  };
}

export interface SetupCommandOptions {
  program: Command;
  config: CliConfig;
}

export const defaultCliConfig: CliConfig = {
  templates: {
    javascript: {
      templates: {
        simple: {
          description: "A basic Node.js starter project.",
          location: "./templates/nodejs/simple",
        },
        vue: {
          description: "An official Vue.js project.",
          location: "{pm} create vue@latest",
          cacheStrategy: "always-refresh",
        },
        nuxt: {
          description: "An official Nuxt.js project.",
          location: "{pm} create nuxt@latest",
          alias: "nx",
        },
        nest: {
          description: "An official Nest.js project.",
          location: "{pm} install -g @nestjs/cli && nest new",
        },
      },
    },
  },
  settings: {
    defaultPackageManager: PackageManagers.Bun,
    cacheStrategy: "daily",
    language: TextLanguages.English,
  },
};

export const CONFIG_FILE_NAMES = [".devkitrc", ".devkitrc.json"] as const;

export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : "";

export const FILE_NAMES = {
  common: {
    packageJson: "package.json",
    git: ".git",
  },
  javascript: {
    lockFiles: [
      "package-lock.json",
      "bun.lockb",
      "yarn.lock",
      "pnpm-lock.yaml",
    ],
  },
} as const;
