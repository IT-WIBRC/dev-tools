import { describe, it, expect, vi } from "vitest";
import path from "path";
import { normalizePath } from "../../../../src/utils/path/normalizer.js";

vi.spyOn(process, "cwd").mockReturnValue("/user/home/project");

describe("normalizePath", () => {
  it("should remove the 'file://' protocol from a URL and decode encoded characters", () => {
    const filePath = "file:///absolute/path/to%20the%20template";
    const normalized = normalizePath(filePath);
    expect(normalized).toBe("/absolute/path/to the template");
  });

  it("should remove the 'file://' protocol from a URL on Windows and decode encoded characters", () => {
    const filePath = "file:///C:/Users/User%20Name/My%20Project";
    const normalized = normalizePath(filePath);
    expect(normalized).toBe("/C:/Users/User Name/My Project");
  });

  it("should resolve a relative path to an absolute path based on CWD", () => {
    const relativePath = "templates/my-template";
    const normalized = normalizePath(relativePath);
    expect(normalized).toBe(path.join(process.cwd(), relativePath));
    expect(normalized).toBe("/user/home/project/templates/my-template");
  });

  it("should return a Unix absolute path unchanged", () => {
    const absolutePath = "/absolute/path/to/template";
    const normalized = normalizePath(absolutePath);
    expect(normalized).toBe(absolutePath);
  });

  it("should return a Windows absolute path unchanged", () => {
    const windowsPath = "C:\\Users\\User\\Templates";
    const normalized = normalizePath(windowsPath);
    expect(normalized).toBe(windowsPath);
  });

  it("should return a Windows UNC path unchanged", () => {
    const uncPath = "\\\\Server\\Share\\Templates";
    const normalized = normalizePath(uncPath);
    expect(normalized).toBe(uncPath);
  });
});
