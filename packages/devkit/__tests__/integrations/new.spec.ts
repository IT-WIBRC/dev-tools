import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from "vitest";
import path from "path";
import os from "os";
import {
  CLI_PATH,
  fs,
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
  execute,
} from "./common.js";

const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];

let originalCwd: string;

const emptyConfig: CliConfig = {
  ...defaultCliConfig,
  templates: {},
};

const userTemplates = {
  javascript: {
    templates: {
      vuejs: {
        description: "A Vue.js project template",
        location: "file://./packages/templates/javascript/vuejs",
        alias: "vue",
        packageManager: "npm",
      },
      nestjs: {
        description: "A NestJS API boilerplate",
        location: "file://./packages/templates/javascript/nestjs",
        alias: "nest",
        packageManager: "npm",
      },
    },
  },
  typescript: {
    templates: {
      tsexpress: {
        description: "A TypeScript Express app",
        location: "file://./packages/templates/typescript/tsexpress",
        alias: "ts-exp",
        packageManager: "npm",
      },
    },
  },
};

const createConfigWithUserTemplates = (templateLocation: string): CliConfig =>
  ({
    ...emptyConfig,
    templates: {
      ...emptyConfig.templates,
      javascript: {
        templates: {
          vuejs: {
            ...userTemplates.javascript.templates.vuejs,
            location: `${templateLocation}/javascript/vuejs`,
          },
          nestjs: {
            ...userTemplates.javascript.templates.nestjs,
            location: `${templateLocation}/javascript/nestjs`,
          },
        },
      },
      typescript: {
        templates: {
          tsexpress: {
            ...userTemplates.typescript.templates.tsexpress,
            location: `${templateLocation}/typescript/tsexpress`,
          },
        },
      },
    },
  }) as CliConfig;

describe("dk new", () => {
  beforeAll(() => {
    vi.unmock("#utils/shell.js");
  });

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  describe("dk new (Global Install)", () => {
    let mockInstallDir: string;
    let mockProjectDir: string;

    beforeEach(async () => {
      originalCwd = process.cwd();
      mockInstallDir = path.join(
        os.tmpdir(),
        `devkit-test-install-${Date.now()}`,
      );
      mockProjectDir = path.join(
        os.tmpdir(),
        `devkit-test-project-${Date.now()}`,
      );

      await fs.ensureDir(mockInstallDir);
      await fs.ensureDir(mockProjectDir);

      process.env.HOME = mockInstallDir;

      const devkitDistDir = path.join(mockInstallDir, "dist");
      const templatesDir = path.join(mockInstallDir, "templates");
      const templatesJsDir = path.join(templatesDir, "javascript");
      const templatesTsDir = path.join(templatesDir, "typescript");

      await fs.ensureDir(devkitDistDir);
      await fs.ensureDir(templatesJsDir);
      await fs.ensureDir(templatesTsDir);

      const configWithTemplates = createConfigWithUserTemplates(
        `file://${path.join(mockInstallDir, "templates")}`,
      );
      await fs.writeJson(
        path.join(mockInstallDir, LOCAL_CONFIG_FILE_NAME),
        configWithTemplates,
      );

      await fs.ensureDir(path.join(templatesJsDir, "vuejs"));
      await fs.writeFile(path.join(templatesJsDir, "vuejs", "package.json"), {
        name: "test-vue-template",
      });
      await fs.writeFile(
        path.join(templatesJsDir, "vuejs", "vue-test.txt"),
        "vue content",
      );

      await fs.ensureDir(path.join(templatesJsDir, "nestjs"));
      await fs.writeFile(path.join(templatesJsDir, "nestjs", "package.json"), {
        name: "test-nest-template",
      });
      await fs.writeFile(
        path.join(templatesJsDir, "nestjs", "nest-test.txt"),
        "nestjs content",
      );

      await fs.ensureDir(path.join(templatesTsDir, "tsexpress"));
      await fs.writeFile(
        path.join(templatesTsDir, "tsexpress", "package.json"),
        { name: "test-ts-express-template" },
      );
      await fs.writeFile(
        path.join(templatesTsDir, "tsexpress", "ts-express-test.txt"),
        "ts express content",
      );
    });

    afterEach(async () => {
      await fs.remove(mockInstallDir);
      await fs.remove(mockProjectDir);
      delete process.env.HOME;
    });

    it("should successfully scaffold a new project from a different directory (canonical language: javascript)", async () => {
      const { exitCode } = await execute(
        "bun",
        [CLI_PATH, "new", "javascript", "my-vue-app", "-t", "vuejs"],
        { cwd: mockProjectDir, all: true },
      );
      expect(exitCode).toBe(0);

      expect(
        await fs.pathExists(
          path.join(mockProjectDir, "my-vue-app", "package.json"),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(mockProjectDir, "my-vue-app", "vue-test.txt"),
        ),
      ).toBe(true);
    });

    it("should successfully scaffold a new project using the 'ts' language alias", async () => {
      const { exitCode } = await execute(
        "bun",
        [CLI_PATH, "new", "ts", "my-ts-app", "-t", "ts-exp"],
        { cwd: mockProjectDir, all: true },
      );
      expect(exitCode).toBe(0);

      expect(
        await fs.pathExists(
          path.join(mockProjectDir, "my-ts-app", "package.json"),
        ),
      ).toBe(true);

      expect(
        await fs.pathExists(
          path.join(mockProjectDir, "my-ts-app", "ts-express-test.txt"),
        ),
      ).toBe(true);
    });
  }, 10000);

  describe("dk new (Monorepo Usage)", () => {
    let tempDir: string;

    beforeEach(async () => {
      originalCwd = process.cwd();
      tempDir = path.join(os.tmpdir(), `devkit-test-monorepo-${Date.now()}`);
      await fs.ensureDir(tempDir);

      process.env.HOME = tempDir;

      const packagesDevkitDir = path.join(tempDir, "packages", "devkit");
      const packagesTemplatesJsDir = path.join(
        tempDir,
        "packages",
        "templates",
        "javascript",
      );
      const packagesTemplatesTsDir = path.join(
        tempDir,
        "packages",
        "templates",
        "typescript",
      );

      await fs.ensureDir(packagesDevkitDir);
      await fs.ensureDir(packagesTemplatesJsDir);
      await fs.ensureDir(packagesTemplatesTsDir);

      const configWithTemplates = createConfigWithUserTemplates(
        "file://./packages/templates",
      );
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        configWithTemplates,
      );

      await fs.ensureDir(path.join(packagesTemplatesJsDir, "vuejs"));
      await fs.writeFile(
        path.join(packagesTemplatesJsDir, "vuejs", "package.json"),
        JSON.stringify({ name: "test-vue-template" }),
      );
      await fs.writeFile(
        path.join(packagesTemplatesJsDir, "vuejs", "vue-test.txt"),
        "vue content",
      );

      await fs.ensureDir(path.join(packagesTemplatesJsDir, "nestjs"));
      await fs.writeFile(
        path.join(packagesTemplatesJsDir, "nestjs", "package.json"),
        { name: "test-nest-template" },
      );
      await fs.writeFile(
        path.join(packagesTemplatesJsDir, "nestjs", "nest-test.txt"),
        "nestjs content",
      );

      await fs.ensureDir(path.join(packagesTemplatesTsDir, "tsexpress"));
      await fs.writeFile(
        path.join(packagesTemplatesTsDir, "tsexpress", "package.json"),
        { name: "test-ts-express-template" },
      );
      await fs.writeFile(
        path.join(packagesTemplatesTsDir, "tsexpress", "ts-express-test.txt"),
        "ts express content",
      );
    });

    afterEach(async () => {
      await fs.remove(tempDir);
      delete process.env.HOME;
    });

    it("should successfully scaffold a new project within the monorepo (canonical language: javascript)", async () => {
      const { exitCode } = await execute(
        "bun",
        [CLI_PATH, "new", "javascript", "my-vue-app", "-t", "vuejs"],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);
      expect(
        await fs.pathExists(path.join(tempDir, "my-vue-app", "package.json")),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, "my-vue-app", "vue-test.txt")),
      ).toBe(true);
    });

    it("should successfully scaffold a new project within the monorepo using the 'ts' language alias", async () => {
      const { exitCode } = await execute(
        "bun",
        [CLI_PATH, "new", "ts", "my-ts-app-mono", "-t", "ts-exp"],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);

      expect(
        await fs.pathExists(
          path.join(tempDir, "my-ts-app-mono", "package.json"),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(tempDir, "my-ts-app-mono", "ts-express-test.txt"),
        ),
      ).toBe(true);
    });
  });
});
