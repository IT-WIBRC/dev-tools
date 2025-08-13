export const ProgrammingLanguage = {
  Nodejs: 'Node.js',
  Python: 'Python',
  Go: 'Go',
} as const;

export const NodejsFramework = {
  Vue: 'Vue.js',
  Nuxt: 'Nuxt.js',
  Nest: 'Nest.js',
} as const;

export const UnitTestingLibrary = {
  Jest: 'Jest',
  Vitest: 'Vitest',
  None: 'None',
} as const;

export const E2ELibrary = {
  Cypress: 'Cypress',
  Playwright: 'Playwright',
  None: 'None',
} as const;

export const PackageManagers = {
  Bun: 'bun',
  Npm: 'npm',
  Yarn: 'yarn',
  Deno: 'deno',
} as const;

export type ValuesOf<T> = T[keyof T];
