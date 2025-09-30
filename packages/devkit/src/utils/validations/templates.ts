import fs from "../fs/file.js";
import { execute } from "#utils/shell.js";
import { DevkitError } from "#utils/errors/base.js";
import { handleErrorAndExit } from "#utils/errors/handler.js";
import { t } from "#utils/i18n/translator.js";
import { normalizePath } from "#utils/fs/path-normalizer.js";
import type { Ora } from "ora";

const checkGitHubRepoExists = async (url: string): Promise<boolean> => {
  try {
    const { exitCode } = await execute("git", ["ls-remote", url, "HEAD"], {
      reject: false,
    });
    return exitCode === 0;
    // oxlint-disable-next-line no-unused-vars
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
    spinner?.start(t("messages.status.template_adding"));
    const isValid = await checkGitHubRepoExists(location);
    if (!isValid) {
      spinner?.fail();
      handleErrorAndExit(
        new DevkitError(t("errors.validation.github_repo", { url: location })),
        spinner,
      );
      return;
    }
    spinner?.succeed();
  } else {
    const filePath = normalizePath(location);
    if (!fs.existsSync(filePath)) {
      handleErrorAndExit(
        new DevkitError(t("errors.validation.local_path", { path: filePath })),
        spinner,
      );
    }
  }
};

export function validateAlias(alias: string): void {
  if (!alias.trim()) {
    throw new DevkitError(t("errors.validation.alias_empty"));
  }
  if (alias.trim().length < 2) {
    throw new DevkitError(t("errors.validation.alias_too_short"));
  }
}

export function validateDescription(description: string): void {
  if (!description.trim()) {
    throw new DevkitError(t("errors.validation.description_empty"));
  }
  const wordCount = description.replaceAll(" ", "").length;
  if (wordCount < 10) {
    throw new DevkitError(t("errors.validation.description_too_short"));
  }
}
