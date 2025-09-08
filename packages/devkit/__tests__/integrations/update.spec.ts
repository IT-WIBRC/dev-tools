import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import { execa } from "execa";
import fs from "../../src/utils/fileSystem.js";
import path from "path";
import os from "os";
import { CONFIG_FILE_NAMES } from "../../src/utils/configs/schema.js";

const CLI_PATH = path.resolve("./dist/bundle.js");
const LOCAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[1];
const GLOBAL_CONFIG_FILE_NAME = CONFIG_FILE_NAMES[0];

let tempDir: string;
let originalCwd: string;

const mockGlobalConfig = {
  templates: {
    docs: {
      templates: {
        vite: {
          description: "Vite project template",
          location: "https://github.com/vitejs/vite",
          alias: "vite",
          packageManager: "npm",
        },
      },
    },
    javascript: {
      templates: {
        "node-ts": {
          description: "Node.js with TypeScript",
          location: "https://github.com/test/node-ts",
          packageManager: "npm",
        },
      },
    },
  },
};

const mockLocalConfig = {
  templates: {
    javascript: {
      templates: {
        vuejs: {
          description: "Vue.js project template",
          location: "file://./packages/templates/javascript/vuejs",
          alias: "vue",
          packageManager: "yarn",
        },
        reactjs: {
          description: "React.js project template",
          location: "file://./packages/templates/javascript/reactjs",
          alias: "react",
          packageManager: "npm",
        },
      },
    },
  },
};

describe("dk update", () => {
  beforeAll(() => {
    vi.unmock("execa");
  });

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });

  async function createMockEnvironment(configType: "local" | "global") {
    tempDir = path.join(os.tmpdir(), `devkit-test-update-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);

    if (configType === "local") {
      await fs.writeJson(LOCAL_CONFIG_FILE_NAME, mockLocalConfig);
    } else {
      process.env.HOME = tempDir;
      await fs.writeJson(GLOBAL_CONFIG_FILE_NAME, mockGlobalConfig);
    }
  }

  describe("dk update (Local Configuration)", () => {
    beforeEach(async () => {
      await createMockEnvironment("local");
    });

    it("should update a template's description", async () => {
      const { exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "javascript",
          "vuejs",
          "--description",
          "Updated desc",
        ],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(LOCAL_CONFIG_FILE_NAME);
      expect(
        updatedConfig.templates.javascript.templates.vuejs.description,
      ).toBe("Updated desc");
    });

    it("should update a template's alias", async () => {
      const { exitCode } = await execa(
        "bun",
        [CLI_PATH, "update", "javascript", "vuejs", "--alias", "new-alias"],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(LOCAL_CONFIG_FILE_NAME);
      expect(updatedConfig.templates.javascript.templates.vuejs.alias).toBe(
        "new-alias",
      );
    });

    it("should update multiple properties at once", async () => {
      const { exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "javascript",
          "vuejs",
          "-d",
          "Mult-update",
          "-l",
          "https://new-location.com",
        ],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(LOCAL_CONFIG_FILE_NAME);
      const template = updatedConfig.templates.javascript.templates.vuejs;
      expect(template.description).toBe("Mult-update");
      expect(template.location).toBe("https://new-location.com");
    });

    it("should rename a template successfully", async () => {
      const { exitCode } = await execa(
        "bun",
        [CLI_PATH, "update", "javascript", "vuejs", "-n", "renamed-template"],
        { all: true, cwd: tempDir },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(LOCAL_CONFIG_FILE_NAME);
      expect(
        updatedConfig.templates.javascript.templates["renamed-template"],
      ).toBeDefined();
      expect(
        updatedConfig.templates.javascript.templates.vuejs,
      ).toBeUndefined();
    });
  });

  describe("dk update (Global Configuration)", () => {
    beforeEach(async () => {
      await createMockEnvironment("global");
    });

    afterEach(async () => {
      delete process.env.HOME;
    });

    it("should update a 'docs' template in the global config", async () => {
      const { exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "docs",
          "vite",
          "--description",
          "Global update desc",
          "-g",
        ],
        { all: true, cwd: tempDir, env: { HOME: tempDir } },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(GLOBAL_CONFIG_FILE_NAME);
      expect(updatedConfig.templates.docs.templates.vite.description).toBe(
        "Global update desc",
      );
    });

    it("should update a 'javascript' template in the global config", async () => {
      const { exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "javascript",
          "node-ts",
          "--package-manager",
          "yarn",
          "-g",
        ],
        { all: true, cwd: tempDir, env: { HOME: tempDir } },
      );
      expect(exitCode).toBe(0);

      const updatedConfig = await fs.readJson(GLOBAL_CONFIG_FILE_NAME);
      expect(
        updatedConfig.templates.javascript.templates["node-ts"].packageManager,
      ).toBe("yarn");
    });
  });

  describe("dk update (Error Handling)", () => {
    beforeEach(async () => {
      await createMockEnvironment("local");
    });

    it("should fail if no config file is found", async () => {
      await fs.remove(LOCAL_CONFIG_FILE_NAME);

      const { all, exitCode } = await execa(
        "bun",
        [CLI_PATH, "update", "javascript", "vuejs", "--description", "test"],
        { all: true, cwd: tempDir, reject: false },
      );
      expect(exitCode).toBe(1);
      expect(all).toContain(
        "An unexpected error occurred: No configuration file found. Run 'devkit config init' to create a global one, or 'devkit config init --local' to create a local one.",
      );
    });

    it("should fail if the language is not found", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "non-existent-lang",
          "vuejs",
          "--description",
          "test",
        ],
        { all: true, cwd: tempDir, reject: false },
      );
      expect(exitCode).toBe(1);
      expect(all).toContain(
        "An unexpected error occurred: Scaffolding language not found in configuration: 'non-existent-lang'",
      );
    });

    it("should fail if the template is not found", async () => {
      const { all, exitCode } = await execa(
        "bun",
        [
          CLI_PATH,
          "update",
          "javascript",
          "non-existent-template",
          "--description",
          "test",
        ],
        { all: true, cwd: tempDir, reject: false },
      );
      expect(exitCode).toBe(1);
      expect(all).toContain(
        "An unexpected error occurred: Template 'non-existent-template' not found in configuration.",
      );
    });
  });
});
