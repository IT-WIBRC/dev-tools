// import {
//   describe,
//   it,
//   expect,
//   vi,
//   beforeAll,
//   afterAll,
//   MockInstance,
// } from "vitest";
// import { getTemplateFromCache } from "../../src/utils/cache.js";
// import fs from "fs-extra";
// import { execa } from "execa";
// import ora from "ora";

// vi.mock("fs-extra", async (importOriginal) => {
//   const mod = await importOriginal<typeof import("fs-extra")>();
//   return {
//     ...mod,
//     existsSync: vi.fn(),
//     ensureDir: vi.fn(),
//     stat: vi.fn(),
//     copy: vi.fn(),
//   };
// });

// vi.mock("execa", () => ({
//   execa: vi.fn(() => ({})),
// }));

// vi.mock("../../src/utils/i18n.js", () => ({
//   t: (key: string, vars: Record<string, string> = {}) =>
//     Object.entries(vars).reduce(
//       (str, [name, value]) => str.replace(`{${name}}`, value),
//       key,
//     ),
// }));

// const mockOraInstance = {
//   start: vi.fn().mockReturnThis(),
//   succeed: vi.fn().mockReturnThis(),
//   fail: vi.fn().mockReturnThis(),
//   info: vi.fn().mockReturnThis(),
//   text: "",
// };
// vi.mock("ora", () => ({
//   default: vi.fn(() => mockOraInstance),
// }));

// describe("getTemplateFromCache", () => {
//   const originalCwd = process.cwd();
//   let existsSyncSpy: MockInstance<typeof fs.existsSync>;
//   let statSpy: MockInstance<typeof fs.stat>;
//   let copySpy: MockInstance<typeof fs.copy>;
//   let execaSpy: MockInstance<typeof execa>;

//   beforeAll(() => {
//     vi.spyOn(process, "cwd").mockReturnValue("/mock-cwd");
//     existsSyncSpy = vi.spyOn(fs, "existsSync");
//     statSpy = vi.spyOn(fs, "stat");
//     copySpy = vi.spyOn(fs, "copy");
//     execaSpy = vi.spyOn(execa, "execa");
//   });

//   afterAll(() => {
//     vi.restoreAllMocks();
//     vi.spyOn(process, "cwd").mockReturnValue(originalCwd);
//   });

//   it("should clone a repo and cache it when it does not exist", async () => {
//     existsSyncSpy.mockReturnValue(false);

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "never-refresh" as const,
//     };

//     await getTemplateFromCache(options);

//     expect(execaSpy).toHaveBeenCalledWith(
//       "git",
//       ["clone", "https://github.com/test-org/test-repo.git", "."],
//       expect.anything(),
//     );

//     expect(copySpy).toHaveBeenCalledWith(
//       expect.stringContaining("test-repo"),
//       expect.stringContaining("/mock-cwd/my-project"),
//       expect.anything(),
//     );
//   });

//   it("should pull the latest changes when the cache strategy is 'always-refresh'", async () => {
//     existsSyncSpy.mockReturnValue(true);
//     statSpy.mockRejectedValue(new Error("File not found"));

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "always-refresh" as const,
//     };

//     await getTemplateFromCache(options);

//     expect(execaSpy).toHaveBeenCalledWith("git", ["pull"], expect.anything());
//   });

//   it("should use the cached version if the strategy is 'daily' and the cache is fresh", async () => {
//     existsSyncSpy.mockReturnValue(true);
//     statSpy.mockResolvedValue({
//       mtime: new Date(Date.now() - 1000 * 60 * 60),
//     });

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "daily" as const,
//     };

//     await getTemplateFromCache(options);

//     expect(execaSpy).not.toHaveBeenCalled();

//     expect(copySpy).toHaveBeenCalled();
//     expect(mockOraInstance.info).toHaveBeenCalledWith(
//       expect.stringContaining("🚀 Using cached template for test-repo."),
//     );
//   });

//   it("should pull the latest changes when the 'daily' cache has expired", async () => {
//     existsSyncSpy.mockReturnValue(true);
//     statSpy.mockResolvedValue({
//       mtime: new Date(Date.now() - 1000 * 60 * 60 * 25),
//     });

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "daily" as const,
//     };

//     await getTemplateFromCache(options);

//     expect(execaSpy).toHaveBeenCalledWith("git", ["pull"], expect.anything());

//     expect(copySpy).toHaveBeenCalled();
//   });

//   it("should copy files from the cache to the project directory", async () => {
//     existsSyncSpy.mockReturnValue(true);
//     statSpy.mockResolvedValue({
//       mtime: new Date(),
//     });

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "never-refresh" as const,
//     };

//     await getTemplateFromCache(options);

//     expect(copySpy).toHaveBeenCalledWith(
//       expect.stringContaining("test-repo"),
//       path.join("/mock-cwd", "my-project"),
//       expect.anything(),
//     );

//     expect(mockOraInstance.text).toEqual(
//       expect.stringContaining("cache.copy.start"),
//     );
//     expect(mockOraInstance.succeed).toHaveBeenCalledWith(
//       expect.stringContaining("cache.copy.success"),
//     );
//   });

//   it("should fail gracefully if copying from cache throws an error", async () => {
//     existsSyncSpy.mockReturnValue(true);
//     statSpy.mockResolvedValue({
//       mtime: new Date(),
//     });
//     copySpy.mockRejectedValue(new Error("Copy error"));

//     const options = {
//       url: "https://github.com/test-org/test-repo.git",
//       projectName: "my-project",
//       spinner: mockOraInstance,
//       strategy: "never-refresh" as const,
//     };

//     await expect(getTemplateFromCache(options)).rejects.toThrow("Copy error");
//     expect(mockOraInstance.fail).toHaveBeenCalledWith(
//       expect.stringContaining("cache.copy.fail"),
//     );
//   });
// });
