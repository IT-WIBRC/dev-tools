import fs from "#utils/system/file.js";

export async function doesRepoExist(repoPath: string): Promise<boolean> {
  try {
    await fs.stat(repoPath);
    return true;
  } catch {
    return false;
  }
}

export async function copyTemplate(
  sourcePath: string,
  destinationPath: string,
) {
  try {
    await fs.copy(sourcePath, destinationPath);
    // oxlint-disable-next-line no-unused-vars
  } catch (error) {
    throw new Error("Failed to copy template.");
  }
}
