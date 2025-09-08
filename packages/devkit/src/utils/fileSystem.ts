import {
  promises as fsPromises,
  existsSync as fsExistsSync,
  type Stats,
} from "fs";
import path from "path";

async function readJson(filePath: string): Promise<any> {
  const fileContent = await fsPromises.readFile(filePath, {
    encoding: "utf8",
  });
  return JSON.parse(fileContent);
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  await fsPromises.writeFile(filePath, jsonString);
}

const existsSync = fsExistsSync;

async function copy(
  source: string,
  destination: string,
  options: {
    filter?: (src: string) => boolean;
  } = {},
): Promise<void> {
  const filterFunction = options.filter || (() => true);

  const stats = await fsPromises.stat(source);

  if (stats.isDirectory()) {
    if (!filterFunction(source)) {
      return;
    }

    await fsPromises.mkdir(destination, { recursive: true });
    const entries = await fsPromises.readdir(source);

    for (const entry of entries) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(destination, entry);
      await copy(srcPath, destPath, options);
    }
  } else if (stats.isFile()) {
    if (!filterFunction(source)) {
      return;
    }
    await fsPromises.copyFile(source, destination);
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function stat(filePath: string): Promise<Stats> {
  return await fsPromises.stat(filePath);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fsPromises.mkdir(dirPath, { recursive: true });
}

async function remove(path: string): Promise<void> {
  await fsPromises.rm(path, { recursive: true, force: true });
}

const writeFile = writeJson;

export default {
  readJson,
  writeJson,
  existsSync,
  copy,
  pathExists,
  stat,
  ensureDir,
  remove,
  writeFile,
};
