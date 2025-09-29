import path from "path";
import fileSystem from "../../src/utils/fs/file.js";
import { execute } from "../../src/utils/shell.js";

export * from "../../src/utils/schema/schema.js";
import { SCHEMA_PATH } from "../../src/core/config/writer.js";

export const CLI_PATH = path.resolve("./bin/scaffolder-toolkit.js");
export const fs = fileSystem;
export { SCHEMA_PATH, execute };
