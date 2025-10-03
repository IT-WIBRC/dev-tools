import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMergedConfig } from "../../../../src/core/config/merger.js";
import {
  type CliConfig,
  type TemplateConfig,
} from "../../../../src/utils/schema/schema.js";

const mockReadConfigSources = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("../../../../src/core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

const LOCATION_MOCK = "mock-location";
const REQUIRED_SETTINGS_BASE = {
  defaultPackageManager: "bun" as const,
  cacheStrategy: "daily" as const,
  language: "en" as const,
};

const createTemplate = (
  name: string,
  desc: string,
  opts?: Partial<TemplateConfig>,
): TemplateConfig => ({
  description: desc,
  location: `${LOCATION_MOCK}/${name}`,
  ...opts,
});

const MOCK_CONFIG_DEFAULT: CliConfig = {
  settings: {
    ...REQUIRED_SETTINGS_BASE,
    cacheStrategy: "never-refresh",
    templateType: "standard",
  } as any,
  templates: {
    javascript: {
      templates: {
        "default-js": createTemplate("default-js", "D - Default JS", {
          cacheStrategy: "always-refresh",
        }),
      },
    },
    arrays: {
      templates: { "def-arr": createTemplate("def-arr", "Default Array Test") },
    } as any,
  },
};

const MOCK_CONFIG_GLOBAL: CliConfig = {
  settings: {
    ...REQUIRED_SETTINGS_BASE,
    language: "fr",
  } as any,
  templates: {
    javascript: {
      templates: {
        "default-js": createTemplate("default-js", "G - Global JS", {
          packageManager: "npm",
        }),
        "global-js": createTemplate("global-js", "G - Global only template"),
      },
    },
    arrays: {
      templates: {
        "glob-arr": createTemplate("glob-arr", "Global Array Test"),
      },
    } as any,
  },
};

const MOCK_CONFIG_LOCAL: CliConfig = {
  settings: {
    ...REQUIRED_SETTINGS_BASE,
    cacheStrategy: "always-refresh",
  } as any,
  templates: {
    javascript: {
      templates: {
        "default-js": createTemplate("default-js", "L - Local JS", {
          alias: "LJS",
        }),
        "local-js": createTemplate("local-js", "L - Local only template"),
      },
    },
    typescript: {
      templates: {
        "local-ts": createTemplate("local-ts", "L - Local TS only"),
      },
    },
    arrays: {
      templates: { "loc-arr": createTemplate("loc-arr", "Local Array Test") },
    },
  },
};

const getMockSources = (
  local: CliConfig | null = MOCK_CONFIG_LOCAL,
  global: CliConfig | null = MOCK_CONFIG_GLOBAL,
  defaultConfig: CliConfig = MOCK_CONFIG_DEFAULT,
) => ({
  local,
  global,
  default: defaultConfig,
  configFound: true,
});

describe("getMergedConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should merge Default, Global, and Local configs with Local having the highest priority (mergeAll: true)", async () => {
    mockReadConfigSources.mockResolvedValueOnce(getMockSources());

    const config = await getMergedConfig();

    expect(mockReadConfigSources).toHaveBeenCalledWith({ mergeAll: true });

    expect(config.settings.cacheStrategy).toBe("always-refresh");
    expect(config.settings.language).toBe("en");
    expect(config.settings.language).toBe("en");

    const templates = config.templates.javascript.templates;

    const defaultJs = templates["default-js"];
    expect(defaultJs.description).toBe("L - Local JS");
    expect(defaultJs.alias).toBe("LJS");
    expect(defaultJs.packageManager).toBe("npm");
    expect(defaultJs.cacheStrategy).toBe("always-refresh");

    expect(templates["local-js"].description).toBe("L - Local only template");

    expect(templates["global-js"].description).toBe("G - Global only template");

    expect(config.templates.typescript.templates["local-ts"]).toBeDefined();

    expect(Object.keys(config.templates.arrays.templates)).toHaveLength(3);
  });

  it("should pass mergeAll: false to readConfigSources", async () => {
    mockReadConfigSources.mockResolvedValueOnce(
      getMockSources(null, MOCK_CONFIG_GLOBAL, MOCK_CONFIG_DEFAULT),
    );

    await getMergedConfig(false);

    expect(mockReadConfigSources).toHaveBeenCalledWith({ mergeAll: false });
  });

  it("should correctly merge Default and Global when Local config is missing (Global > Default)", async () => {
    mockReadConfigSources.mockResolvedValueOnce(
      getMockSources(null, MOCK_CONFIG_GLOBAL, MOCK_CONFIG_DEFAULT),
    );

    const config = await getMergedConfig(false);

    expect(config.settings.language).toBe("fr");
    expect(config.settings.cacheStrategy).toBe("daily");

    const templates = config.templates.javascript.templates;
    const defaultJs = templates["default-js"];
    expect(defaultJs.description).toBe("G - Global JS");
    expect(defaultJs.packageManager).toBe("npm");
    expect(defaultJs.alias).toBeUndefined();

    expect(templates["local-js"]).toBeUndefined();
    expect(config.templates.typescript).toBeUndefined();
  });

  it("should return only the Default config if Local and Global are missing", async () => {
    mockReadConfigSources.mockResolvedValueOnce(
      getMockSources(null, null, MOCK_CONFIG_DEFAULT),
    );

    const config = await getMergedConfig(false);

    expect(config.settings.cacheStrategy).toBe("never-refresh");
    expect(config.settings.language).toBe("en");
    expect(
      config.templates.javascript.templates["default-js"].description,
    ).toBe("D - Default JS");
    expect(
      config.templates.javascript.templates["default-js"].alias,
    ).toBeUndefined();
    expect(config.templates.typescript).toBeUndefined();
  });

  it("should return an empty object if all config sources are null/missing", async () => {
    mockReadConfigSources.mockResolvedValueOnce(
      getMockSources(null, null, null as any),
    );

    const config = await getMergedConfig(false);

    expect(config).toEqual({});
  });
});
