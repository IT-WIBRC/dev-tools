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
import path from "path";
import os from "os";
import { CLI_PATH, fs } from "./common.js";

let tempDir: string;
let originalCwd: string;
let globalConfigDir: string;

describe("dk --verbose", () => {
  beforeAll(() => {
    vi.unmock("execa");
    globalConfigDir = path.join(os.tmpdir(), "devkit-global-config-dir");
  });

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `devkit-test-verbose-${Date.now()}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
    await fs.ensureDir(globalConfigDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
    await fs.remove(globalConfigDir);
  });

  const runTestCommand = (args: string[]) => {
    return execa("bun", [CLI_PATH, "list", ...args], {
      all: true,
      env: { HOME: globalConfigDir },
    });
  };

  it("should not display the success message by default (non-verbose)", async () => {
    const { all } = await runTestCommand([]);
    expect(all).not.toContain("CLI initialized successfully.");
  });

  it("should display the success message when the --verbose flag is used", async () => {
    const { all } = await runTestCommand(["--verbose"]);
    expect(all).toContain("CLI initialized successfully.");
  });

  it("should display the config warning even without --verbose when using a default config", async () => {
    const { all } = await runTestCommand([]);
    expect(all).toContain(
      "⚠️ No configuration file found. Using default settings.",
    );
    expect(all).not.toContain("CLI initialized successfully.");
  });
});
