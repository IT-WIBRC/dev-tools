import {
  FILE_NAMES,
  type SupportedProgrammingLanguageKeys,
} from "#utils/schema/schema.js";
import fs from "#utils/fs/file.js";

export function getFilesToFilter(
  language: SupportedProgrammingLanguageKeys,
): string[] {
  const commonFiles = Object.values(FILE_NAMES.common);
  const languageSpecificFiles = FILE_NAMES[language].lockFiles;

  return [...commonFiles, ...languageSpecificFiles];
}

export async function copyJavascriptTemplate(
  repoPath: string,
  destination: string,
): Promise<void> {
  const filesToFilter = getFilesToFilter("javascript");

  await fs.copy(repoPath, destination, {
    filter: (src) => {
      const isFiltered = filesToFilter.some((file) => src.includes(file));
      return !isFiltered;
    },
  });
}
