import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { t } from "./i18n.js";
export function findFileInParents(fileName, startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;
  while (currentDir !== root) {
    const filePath = path.join(currentDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error(t("error.file.not_found", { fileName: fileName }));
}
export function findProjectRoot() {
  const filePath = findFileInParents("package.json", process.cwd());
  return path.dirname(filePath);
}
export function findPackageRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const startDir = dirname(__filename);
  const filePath = findFileInParents("package.json", startDir);
  return path.dirname(filePath);
}
export function findLocalesDir() {
  const packageRoot = findPackageRoot();
  return path.join(packageRoot, "locales");
}
