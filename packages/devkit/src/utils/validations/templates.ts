import fs from "../fileSystem.js";
import { execa } from "execa";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { t } from "#utils/internationalization/i18n.js";
import { normalizePath } from "#utils/path/pathNormalizer.js";
import type { Ora } from "ora";

const checkGitHubRepoExists = async (url: string): Promise<boolean> => {
  try {
    const { exitCode } = await execa("git", ["ls-remote", url, "HEAD"], {
      reject: false,
    });
    return exitCode === 0;
  } catch (error) {
    return false;
  }
};

const isFromGitHub = (location: string): boolean => {
  return (
    ["https://github.com/", "git@github.com"].some((url) =>
      location.startsWith(url),
    ) && location.endsWith(".git")
  );
};

export const validateLocation = async (location: string, spinner?: Ora) => {
  const isGithubUrl = isFromGitHub(location);

  if (isGithubUrl) {
    spinner?.start(t("cli.add_template.adding"));
    const isValid = await checkGitHubRepoExists(location);
    if (!isValid) {
      spinner?.fail();
      handleErrorAndExit(
        new DevkitError(t("error.invalid.github-repo", { url: location })),
        spinner,
      );
      return;
    }
    spinner?.succeed();
  } else {
    const filePath = normalizePath(location);
    if (!fs.existsSync(filePath)) {
      handleErrorAndExit(
        new DevkitError(t("error.invalid.local-path", { path: filePath })),
        spinner,
      );
    }
  }
};

export function validateAlias(alias: string): void {
  if (!alias.trim()) {
    throw new DevkitError(t("error.invalid.alias.empty"));
  }
  if (alias.trim().length < 2) {
    throw new DevkitError(t("error.invalid.alias.too-short"));
  }
}

export function validateDescription(description: string): void {
  if (!description.trim()) {
    throw new DevkitError(t("error.invalid.description.empty"));
  }
  const wordCount = description.replaceAll(" ", "").length;
  if (wordCount < 10) {
    throw new DevkitError(t("error.invalid.description.too-short"));
  }
}
