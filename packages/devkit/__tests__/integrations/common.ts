import path from "path";
import fileSystem from "../../src/utils/fileSystem.js";

export * from "../../src/utils/configs/schema.js";
import { SCHEMA_PATH } from "../../src/utils/configs/writer.js";

export const CLI_PATH = path.resolve("./dist/bundle.js");
export const fs = fileSystem;
export { SCHEMA_PATH };
