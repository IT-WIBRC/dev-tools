export const ProgrammingLanguage = {
  Nodejs: "Node.js",
};
export const NodejsFramework = {
  Vue: "Vue.js",
  Nuxt: "Nuxt.js",
  Nest: "Nest.js",
};
export const UnitTestingLibrary = {
  Jest: "Jest",
  Vitest: "Vitest",
  None: "None",
};
export const E2ELibrary = {
  Cypress: "Cypress",
  Playwright: "Playwright",
  None: "None",
};
export const PackageManagers = {
  Bun: "bun",
  Npm: "npm",
  Yarn: "yarn",
  Deno: "deno",
  Pnpm: "pnpm",
};
export const TextLanguages = {
  English: "en",
  French: "fr",
};
export const defaultCliConfig = {
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
