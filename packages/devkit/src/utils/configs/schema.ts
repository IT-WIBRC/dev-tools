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
export type SupportedPackageManager = ValuesOf<typeof PackageManagers>;

export type ValuesOf<T> = T[keyof T];

export const VALID_PACKAGE_MANAGERS = Object.seal(
  Object.values(PackageManagers),
);

export const VALID_CACHE_STRATEGIES = [
  "always-refresh",
  "never-refresh",
  "daily",
] as const;
export type CacheStrategy = (typeof VALID_CACHE_STRATEGIES)[number];

export const TextLanguages = {
  English: "en",
  French: "fr",
} as const;
export type TextLanguageValues = ValuesOf<typeof TextLanguages>;

export const SUPPORTED_LANGUAGES = Object.seal(Object.values(TextLanguages));

export type LowercaseValues<T extends string> =
  T extends `${infer U}.${infer E}`
    ? `${Lowercase<U>}${E}`
    : T extends `${infer U}`
      ? Lowercase<U>
      : T;

export type SupportedProgrammingLanguageValues = LowercaseValues<
  ValuesOf<typeof ProgrammingLanguage>
>;

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

export interface CliConfig {
  templates: Record<string, LanguageConfig>;
  settings: {
    defaultPackageManager: SupportedPackageManager;
    cacheStrategy: CacheStrategy;
    language: TextLanguageValues;
  };
}

export type ConfigurationSource = "local" | "global" | "default";

export interface UpdateCommandOptions {
  global: boolean;
  description?: string;
  alias?: string;
  location?: string;
  cacheStrategy?: CacheStrategy | "null";
  packageManager?: SupportedPackageManager | "null";
  newName?: string;
}

export interface SetupCommandOptions {
  program: Command;
  config: CliConfig;
  configPath?: string;
  source?: ConfigurationSource;
}

export const defaultCliConfig: CliConfig = {
  templates: {
    javascript: {
      templates: {
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
        nextjs: {
          description: "An official Next.js project.",
          location: "{pm} create next-app@latest",
          alias: "next",
        },
        express: {
          description: "A simple Express.js boilerplate from its generator.",
          location: "https://github.com/expressjs/express-generator.git",
          alias: "ex",
        },
        fastify: {
          description: "A highly performant Fastify web framework boilerplate.",
          location: "https://github.com/fastify/fastify-cli.git",
          alias: "fy",
        },
        koa: {
          description: "A Koa.js web framework boilerplate.",
          location: "https://github.com/koajs/koa-generator.git",
        },
        adonis: {
          description: "A full-stack Node.js framework (AdonisJS).",
          location: "{pm} create adonisjs",
          alias: "ad",
        },
        sails: {
          description: "A real-time, MVC framework (Sails.js).",
          location: "{pm} install -g sails && sails new",
        },
        angular: {
          description: "An official Angular project.",
          location: "{pm} install -g @angular/cli && ng new",
          alias: "ng",
        },
        "angular-vite": {
          description: "An Angular project using Vite via AnalogJS.",
          location: "{pm} create analog@latest",
          alias: "ng-v",
        },
        react: {
          description: "A React project using the recommended Vite setup.",
          location: "{pm} create vite@latest -- --template react",
          alias: "rt",
        },
        svelte: {
          description: "A Svelte project using SvelteKit.",
          location: "{pm} create svelte@latest",
        },
        qwik: {
          description: "An official Qwik project.",
          location: "{pm} create qwik@latest",
        },
        astro: {
          description: "A new Astro project.",
          location: "{pm} create astro@latest",
        },
        solid: {
          description: "An official SolidJS project.",
          location: "{pm} create solid@latest",
        },
        remix: {
          description: "An official Remix project.",
          location: "{pm} create remix@latest",
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

export const CONFIG_FILE_NAMES = [".devkitrc", ".devkit.json"] as const;

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
  packageJson: "package.json",
  common: {
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
