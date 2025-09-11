import path from "path";
import fs from "#utils/fileSystem.js";
import { homedir } from "os";

interface FindUpOptions {
  files: string | string[];
  cwd?: string;
  limit?: string;
}

export async function findUp({
  files,
  cwd,
  limit,
}: FindUpOptions): Promise<string | null> {
  let currentDir = path.resolve(cwd ?? process.cwd());
  const filesToFind = Array.isArray(files) ? files : [files];

  while (true) {
    for (const file of filesToFind) {
      const filePath = path.join(currentDir, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isDirectory() || stats.isFile()) {
          return filePath;
        }
      } catch (e) {
        // File does not exist, continue search
      }
    }

    if (currentDir === limit) {
      break;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || currentDir === homedir()) {
      break;
    }

    currentDir = parentDir;
  }
  return null;
}
