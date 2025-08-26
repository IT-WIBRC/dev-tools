import fs from "fs-extra";
import path from "path";
import { ConfigError } from "../errors/base.js";
import { t } from "#utils/internationalization/i18n.js";
import { type CliConfig } from "./schema.js";

export async function readConfigAtPath(
  filePath: string,
): Promise<CliConfig | null> {
  try {
    const config = await fs.readJson(filePath);
    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw new ConfigError(
      t("error.config.parse", { file: path.basename(filePath) }),
      filePath,
      { cause: error },
    );
  }
}
