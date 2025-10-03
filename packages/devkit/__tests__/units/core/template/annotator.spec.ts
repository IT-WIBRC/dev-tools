import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAnnotatedTemplates } from "../../../../src/core/template/annotator.js";
import {
  type CliConfig,
  type TextLanguageValues,
} from "../../../../src/utils/schema/schema.js";
import { type ConfigurationSources } from "../../../../src/core/config/loader.js";

const mockReadConfigSources = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("../../../../src/core/config/loader.js", () => ({
  readConfigSources: mockReadConfigSources,
}));

const REQUIRED_SETTINGS_BASE: CliConfig["settings"] = {
  defaultPackageManager: "bun",
  cacheStrategy: "daily",
  language: "en",
};

const LOCATION = "/mock/location";
const DESCRIPTION = "Mock description";

const MOCK_TEMPLATE_DEFAULT: CliConfig = {
  settings: {
    ...REQUIRED_SETTINGS_BASE,
    cacheStrategy: "never-refresh",
  },
  templates: {
    javascript: {
      templates: {
        "default-js": {
          location: LOCATION,
          description: DESCRIPTION,
          packageManager: "yarn",
        },
        "shared-js": {
          location: LOCATION,
          description: "Shared JS default",
          packageManager: "npm",
        },
      },
    },
    typescript: {
      templates: {
        "shared-ts": {
          location: LOCATION,
          description: "Shared TS default",
          packageManager: "npm",
        },
        "default-ts": {
          location: LOCATION,
          description: DESCRIPTION,
          alias: "dts",
        },
      },
    },
  },
};

const MOCK_TEMPLATE_GLOBAL: CliConfig = {
  settings: { ...REQUIRED_SETTINGS_BASE, language: "fr" },
  templates: {
    typescript: {
      templates: {
        "shared-ts": {
          location: "/global/loc",
          description: "Shared TS global",
        },
        "global-ts": { location: "/global/loc", description: DESCRIPTION },
      },
    },
    python: {
      templates: {
        "global-py": { location: "/global/loc", description: DESCRIPTION },
      },
    },
  },
};

const MOCK_TEMPLATE_LOCAL: CliConfig = {
  settings: {
    ...REQUIRED_SETTINGS_BASE,
    language: "es" as TextLanguageValues,
  },
  templates: {
    typescript: {
      templates: {
        "shared-ts": {
          location: "/local/loc",
          description: "Shared TS local",
        },
        "global-ts": {
          location: "/local/loc",
          description: "Global TS local override",
        },
        "local-ts": {
          location: "/local/loc",
          description: DESCRIPTION,
        },
      },
    },
  },
};

const getMockSources = (
  local: CliConfig | null = MOCK_TEMPLATE_LOCAL,
  global: CliConfig | null = MOCK_TEMPLATE_GLOBAL,
  defaultConfig: CliConfig | null = MOCK_TEMPLATE_DEFAULT,
): ConfigurationSources => ({
  local,
  global,
  default: defaultConfig,
  configFound: !!local || !!global || !!defaultConfig,
});

describe("getAnnotatedTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should include Local only, and exclude Global and Defaults by default (no flags)", async () => {
    mockReadConfigSources.mockResolvedValue(getMockSources());

    const options = {
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: false,
    };
    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(3);
    expect(templates.some((t) => t._name === "global-py")).toBe(false);

    const sharedTs = templates.find((t) => t._name === "shared-ts");
    expect(sharedTs?._source).toBe("local");
  });

  it("should include Defaults, and be overridden by Local (Global is skipped)", async () => {
    mockReadConfigSources.mockResolvedValue(getMockSources());

    const options = {
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: true,
    };
    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(6);
    expect(templates.some((t) => t._name === "global-py")).toBe(false);

    const sharedTs = templates.find(
      (t) => t._name === "shared-ts" && t._language === "typescript",
    );
    expect(sharedTs?._source).toBe("local");

    const sharedJs = templates.find(
      (t) => t._name === "shared-js" && t._language === "javascript",
    );
    expect(sharedJs?._source).toBe("default");
  });

  it("should merge Global and Defaults, ignoring Local templates (forceGlobal: true, Local is present in sources but skipped)", async () => {
    mockReadConfigSources.mockResolvedValue(
      getMockSources(MOCK_TEMPLATE_LOCAL),
    );

    const options = {
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: true,
    };
    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(6);

    expect(templates.some((t) => t._name === "local-ts")).toBe(false);

    const sharedTs = templates.find((t) => t._name === "shared-ts");
    expect(sharedTs?._source).toBe("global");

    const globalPy = templates.find((t) => t._name === "global-py");
    expect(globalPy?._source).toBe("global");
  });

  it("should merge all sources (Local > Global > Default) when mergeAll is true", async () => {
    mockReadConfigSources.mockResolvedValue(getMockSources());

    const options = {
      forceGlobal: false,
      mergeAll: true,
      includeDefaults: true,
    };
    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(7);

    const sharedTs = templates.find(
      (t) => t._name === "shared-ts" && t._language === "typescript",
    );
    expect(sharedTs?._source).toBe("local");

    const globalPy = templates.find((t) => t._name === "global-py");
    expect(globalPy?._source).toBe("global");
  });

  it("should only return Default templates when Local and Global configs are missing (Default mode)", async () => {
    mockReadConfigSources.mockResolvedValue(getMockSources(null, null));

    const options = {
      forceGlobal: false,
      mergeAll: false,
      includeDefaults: true,
    };

    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(4);

    expect(templates.some((t) => t._source === "global")).toBe(false);

    const defaultTs = templates.find((t) => t._name === "default-ts");
    expect(defaultTs?._source).toBe("default");
  });

  it("should return only Global templates (forceGlobal: true, no defaults)", async () => {
    mockReadConfigSources.mockResolvedValue(
      getMockSources(null, MOCK_TEMPLATE_GLOBAL, null),
    );

    const options = {
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: false,
    };

    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(3);
    expect(templates.every((t) => t._source === "global")).toBe(true);
    expect(templates.some((t) => t._name === "global-py")).toBe(true);
  });

  it("should handle null config sources and configs with empty templates section", async () => {
    const emptyConfig: CliConfig = {
      settings: REQUIRED_SETTINGS_BASE,
      templates: {},
    };

    mockReadConfigSources.mockResolvedValue(
      getMockSources(null, MOCK_TEMPLATE_GLOBAL, emptyConfig),
    );

    const options = {
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: true,
    };

    const templates = await getAnnotatedTemplates(options);

    expect(templates).toHaveLength(3);
    expect(templates.every((t) => t._source === "global")).toBe(true);

    const nullTemplatesConfig = {
      settings: REQUIRED_SETTINGS_BASE,
      templates: null,
    } as unknown as CliConfig;
    mockReadConfigSources.mockResolvedValue(
      getMockSources(null, nullTemplatesConfig, nullTemplatesConfig),
    );
    const templatesNull = await getAnnotatedTemplates({
      forceGlobal: true,
      mergeAll: false,
      includeDefaults: true,
    });
    expect(templatesNull).toHaveLength(0);
  });
});
