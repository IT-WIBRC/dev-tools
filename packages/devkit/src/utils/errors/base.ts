export class DevkitError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DevkitError";
  }
}

export class ConfigError extends DevkitError {
  constructor(
    message: string,
    public filePath?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ConfigError";
  }
}

export class GitError extends DevkitError {
  constructor(
    message: string,
    public url?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GitError";
  }
}
