/**
 * @filename: lint-staged.config.mjs
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{json,md,yml,yaml,cjs}": ["prettier --write"],
  "packages/**/*.{js,ts}": ["prettier --write", "oxlint --fix"],
};
