import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  doesRepoExist,
  copyTemplate,
} from "../../../src/utils/cache/fs-manager.js";

const mockStat = vi.hoisted(() => vi.fn());
const mockCopy = vi.hoisted(() => vi.fn());

vi.mock("fs-extra", () => ({
  default: {
    promises: {
      stat: mockStat,
    },
    copy: mockCopy,
  },
}));

describe("Filesystem Manager Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("doesRepoExist", () => {
    it("should return true if the directory exists", async () => {
      mockStat.mockResolvedValueOnce({});
      const result = await doesRepoExist("/path/to/repo");
      expect(result).toBe(true);
      expect(mockStat).toHaveBeenCalledWith("/path/to/repo");
    });

    it("should return false if the directory does not exist", async () => {
      const error = new Error("Not found");
      (error as any).code = "ENOENT";
      mockStat.mockRejectedValueOnce(error);
      const result = await doesRepoExist("/path/to/non-existent-repo");
      expect(result).toBe(false);
      expect(mockStat).toHaveBeenCalledWith("/path/to/non-existent-repo");
    });

    it("should return false for other stat errors", async () => {
      mockStat.mockRejectedValueOnce(new Error("Permission denied"));
      const result = await doesRepoExist("/path/to/restricted-repo");
      expect(result).toBe(false);
    });
  });

  describe("copyTemplate", () => {
    it("should successfully copy the template", async () => {
      mockCopy.mockResolvedValueOnce(undefined);
      await expect(
        copyTemplate("/path/to/source", "/path/to/destination"),
      ).resolves.toBeUndefined();
      expect(mockCopy).toHaveBeenCalledWith(
        "/path/to/source",
        "/path/to/destination",
      );
    });

    it("should throw an error if the copy fails", async () => {
      mockCopy.mockRejectedValueOnce(new Error("Copy failed"));
      await expect(
        copyTemplate("/path/to/source", "/path/to/destination"),
      ).rejects.toThrow("Failed to copy template.");
      expect(mockCopy).toHaveBeenCalledWith(
        "/path/to/source",
        "/path/to/destination",
      );
    });
  });
});
