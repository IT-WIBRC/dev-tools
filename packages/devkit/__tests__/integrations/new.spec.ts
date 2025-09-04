import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from "vitest";
import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  CONFIG_FILE_NAMES,
  defaultCliConfig,
  type CliConfig,
} from "../../src/utils/configs/schema.js";

const CLI_PATH = path.resolve("./dist/bundle.js");
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
    },
  }) as CliConfig;

describe("dk new", () => {
  beforeAll(() => {
    vi.unmock("execa");
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
      const templatesDir = path.join(mockInstallDir, "templates", "javascript");
      await fs.ensureDir(devkitDistDir);
      await fs.ensureDir(templatesDir);

      const configWithTemplates = createConfigWithUserTemplates(
        `file://${path.join(mockInstallDir, "templates")}`,
      );
      await fs.writeJson(
        path.join(mockInstallDir, LOCAL_CONFIG_FILE_NAME),
        configWithTemplates,
        { spaces: 2 },
      );

      await fs.ensureDir(path.join(templatesDir, "vuejs"));
      await fs.writeFile(
        path.join(templatesDir, "vuejs", "package.json"),
        JSON.stringify({ name: "test-vue-template" }),
      );
      await fs.writeFile(
        path.join(templatesDir, "vuejs", "vue-test.txt"),
        "vue content",
      );

      await fs.ensureDir(path.join(templatesDir, "nestjs"));
      await fs.writeFile(
        path.join(templatesDir, "nestjs", "package.json"),
        JSON.stringify({ name: "test-nest-template" }),
      );
      await fs.writeFile(
        path.join(templatesDir, "nestjs", "nest-test.txt"),
        "nestjs content",
      );
    });

    afterEach(async () => {
      await fs.remove(mockInstallDir);
      await fs.remove(mockProjectDir);
      delete process.env.HOME;
    });

    it("should successfully scaffold a new project from a different directory", async () => {
      const { exitCode } = await execa(
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
  });

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
      await fs.ensureDir(packagesDevkitDir);
      await fs.ensureDir(packagesTemplatesJsDir);

      const configWithTemplates = createConfigWithUserTemplates(
        "file://./packages/templates",
      );
      await fs.writeJson(
        path.join(tempDir, LOCAL_CONFIG_FILE_NAME),
        configWithTemplates,
        { spaces: 2 },
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
        JSON.stringify({ name: "test-nest-template" }),
      );
      await fs.writeFile(
        path.join(packagesTemplatesJsDir, "nestjs", "nest-test.txt"),
        "nestjs content",
      );
    });

    afterEach(async () => {
      await fs.remove(tempDir);
      delete process.env.HOME;
    });

    it("should successfully scaffold a new project within the monorepo", async () => {
      const { exitCode } = await execa(
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
  });
});
