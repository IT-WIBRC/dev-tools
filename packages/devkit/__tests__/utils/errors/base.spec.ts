import { describe, it, expect } from "vitest";
import {
  DevkitError,
  ConfigError,
  GitError,
} from "../../../src/utils/errors/base.js";

describe("Custom Error Classes", () => {
  it("DevkitError should be a valid Error and have the correct name", () => {
    const error = new DevkitError("Test message");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DevkitError");
    expect(error.message).toBe("Test message");
  });

  it("ConfigError should be a valid DevkitError and have the correct name", () => {
    const error = new ConfigError("Config message", "/path/to/config.json");
    expect(error).toBeInstanceOf(DevkitError);
    expect(error.name).toBe("ConfigError");
    expect(error.message).toBe("Config message");
    expect(error.filePath).toBe("/path/to/config.json");
  });

  it("GitError should be a valid DevkitError and have the correct name", () => {
    const error = new GitError(
      "Git message",
      "https://github.com/test/repo.git",
    );
    expect(error).toBeInstanceOf(DevkitError);
    expect(error.name).toBe("GitError");
    expect(error.message).toBe("Git message");
    expect(error.url).toBe("https://github.com/test/repo.git");
  });

  it("should handle optional parameters correctly", () => {
    const configError = new ConfigError("Config message without path");
    expect(configError.filePath).toBeUndefined();

    const gitError = new GitError("Git message without url");
    expect(gitError.url).toBeUndefined();
  });
});
