import path from "path";
import fs from "fs-extra";
import { homedir } from "os";

export async function findUp(
  fileName: string | string[],
  startDir: string,
): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const filesToFind = Array.isArray(fileName) ? fileName : [fileName];

  while (true) {
    for (const file of filesToFind) {
      const filePath = path.join(currentDir, file);
      try {
        await fs.promises.stat(filePath);
        return filePath;
      } catch (e) {
        // File does not exist, continue search
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || currentDir === homedir()) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}
