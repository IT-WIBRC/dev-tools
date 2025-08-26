import { findPackageRoot } from "./finder.js";
import path from "path";

export async function findLocalesDir(): Promise<string> {
  const packageRoot = await findPackageRoot();
  return path.join(packageRoot, "locales");
}
