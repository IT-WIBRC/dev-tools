import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

export function findFileInParents(fileName: string, startDir: string): string {
  let currentDir = path.resolve(startDir);
  while (true) {
    const filePath = path.join(currentDir, fileName);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }
  return "";
}

export function findProjectRoot(): string {
  const filePath = findFileInParents("package.json", process.cwd());
  return path.dirname(filePath);
}

export function findPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = findFileInParents("package.json", startDir);
  return path.dirname(filePath);
}

export function findLocalesDir(): string {
  const packageRoot = findPackageRoot();
  return path.join(packageRoot, "locales");
}
