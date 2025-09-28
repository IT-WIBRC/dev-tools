import path from "path";
import fileSystem from "../../src/utils/system/file.js";

export * from "../../src/utils/configs/schema.js";
import { SCHEMA_PATH } from "../../src/utils/configs/writer.js";

export const CLI_PATH = path.resolve("./bin/scaffolder-toolkit.js");
export const fs = fileSystem;
export { SCHEMA_PATH };
