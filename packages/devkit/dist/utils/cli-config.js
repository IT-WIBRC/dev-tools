import { loadUserConfig } from "./config.js";
const configPromise = loadUserConfig();
export function getLoadedConfig() {
  return configPromise;
}
