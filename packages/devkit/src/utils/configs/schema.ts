export const ProgrammingLanguage = {
  Nodejs: "Node.js",
} as const;

export const NodejsFramework = {
  Vue: "Vue.js",
  Nuxt: "Nuxt.js",
  Nest: "Nest.js",
} as const;

export const UnitTestingLibrary = {
  Jest: "Jest",
  Vitest: "Vitest",
  None: "None",
} as const;

export const E2ELibrary = {
  Cypress: "Cypress",
  Playwright: "Playwright",
  None: "None",
} as const;

export const PackageManagers = {
  Bun: "bun",
  Npm: "npm",
  Yarn: "yarn",
  Deno: "deno",
  Pnpm: "pnpm",
} as const;
export type PackageManager =
  (typeof PackageManagers)[keyof typeof PackageManagers];

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

export interface TemplateConfig {
  description: string;
  location: string;
  alias?: string;
  cacheStrategy?: CacheStrategy;
  packageManager?: ValuesOf<typeof PackageManagers>;
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

export interface CliConfig {
  templates: {
    [key in LowercaseValues<
      ValuesOf<typeof ProgrammingLanguage>
    >]?: LanguageConfig;
  } & {
    [key: string]: LanguageConfig;
  };
  settings: {
    defaultPackageManager: ValuesOf<typeof PackageManagers>;
    cacheStrategy?: CacheStrategy;
    language: TextLanguageValues;
  };
}

export const defaultCliConfig: CliConfig = {
  templates: {
    nodejs: {
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

export const CONFIG_FILE_NAMES = [".devkitrc", ".devkitrc.json"];

export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : "";
