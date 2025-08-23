import fs from "fs-extra";

export async function doesRepoExist(repoPath: string): Promise<boolean> {
  try {
    await fs.promises.stat(repoPath);
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
  } catch (error) {
    throw new Error("Failed to copy template.");
  }
}
