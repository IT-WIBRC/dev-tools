import { vi, describe, it, expect } from "vitest";

const { mockFsCopy } = vi.hoisted(() => ({
  mockFsCopy: vi.fn(),
}));
vi.mock("fs-extra", () => ({ default: { copy: mockFsCopy } }));

import {
  copyJavascriptTemplate,
  getFilesToFilter,
} from "../../../src/utils/template-utils.js";

describe("template-utils.ts", () => {
  describe("getFilesToFilter", () => {
    it("should return the correct list of files for JavaScript projects", () => {
      const expectedFiles = [
        ".git",
        "yarn.lock",
        "bun.lockb",
        "pnpm-lock.yaml",
        "package-lock.json",
      ];
      const filesToFilter = getFilesToFilter("javascript");
      expect(filesToFilter).toEqual(expect.arrayContaining(expectedFiles));
      expect(filesToFilter.length).toBe(expectedFiles.length);
    });
  });

  describe("copyJavascriptTemplate", () => {
    it("should copy the template with the correct files excluded", async () => {
      const repoPath = "/path/to/repo";
      const destination = "/path/to/destination";
      const filesToFilter = ["README.md", "LICENSE", "yarn.lock"];

      const getFilesToFilterSpy = vi
        .spyOn({ getFilesToFilter }, "getFilesToFilter")
        .mockReturnValue(filesToFilter);

      await copyJavascriptTemplate(repoPath, destination);

      expect(mockFsCopy).toHaveBeenCalled();

      const [callPath, callDestination, callOptions] = mockFsCopy.mock
        .calls[0] as any[];

      expect(callPath).toBe(repoPath);
      expect(callDestination).toBe(destination);
      expect(callOptions.filter).toBeInstanceOf(Function);

      const filterFunction = callOptions.filter;
      expect(filterFunction("/path/to/repo/src/index.js")).toBe(true);
      expect(filterFunction("/path/to/repo/yarn.lock")).toBe(false);

      getFilesToFilterSpy.mockRestore();
    });
  });
});
