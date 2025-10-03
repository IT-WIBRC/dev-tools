import { vi, describe, it, expect, beforeEach } from "vitest";
import { handleSetAction } from "../../../../../src/commands/config/set/index.js";
import { CONFIG_KEY_ALIASES } from "../../../../../src/commands/config/utils.js";
import { mockSpinner, mocktFn } from "../../../../../vitest.setup.js";

const { mockHandleNonInteractiveSettingsUpdate, mockResolveSingleKey } =
  vi.hoisted(() => ({
    mockHandleNonInteractiveSettingsUpdate: vi.fn(),
    mockResolveSingleKey: vi.fn(),
  }));

vi.mock("#core/config/loader.js", () => ({
  readConfigSources: vi.fn(),
}));

vi.mock("../../../../../src/commands/config/logic.js", () => ({
  handleNonInteractiveSettingsUpdate: mockHandleNonInteractiveSettingsUpdate,
}));

vi.mock("#commands/config/utils.js", async (importOriginal) => {
  const originalModule = await importOriginal<Record<string, unknown>>();
  return {
    ...originalModule,
    resolveSingleKey: mockResolveSingleKey,
  };
});

mockResolveSingleKey.mockImplementation((key: string) => {
  return CONFIG_KEY_ALIASES[key] ? CONFIG_KEY_ALIASES[key] : key;
});

describe("handleSetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleNonInteractiveSettingsUpdate.mockResolvedValue(undefined);
  });

  it("should successfully set a single key using its full name", async () => {
    const values = ["language", "fr"];
    await handleSetAction(values, false, mockSpinner);

    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
      "language",
      "fr",
      false,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it("should successfully set a single key using its short alias", async () => {
    const values = ["pm", "bun"];
    await handleSetAction(values, true, mockSpinner);

    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
      "pm",
      "bun",
      true,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it("should successfully set multiple keys, mixing aliases and full names", async () => {
    const values = ["lang", "en", "packageManager", "pnpm"];
    await handleSetAction(values, false, mockSpinner);

    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledTimes(2);
    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
      "lang",
      "en",
      false,
    );
    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledWith(
      "packageManager",
      "pnpm",
      false,
    );
    expect(mockSpinner.succeed).toHaveBeenCalledOnce();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });

  it("should fail and not process if the number of arguments is odd", async () => {
    const values = ["lang", "en", "pm"];
    await handleSetAction(values, false, mockSpinner);

    expect(mockHandleNonInteractiveSettingsUpdate).not.toHaveBeenCalled();
    expect(mockSpinner.fail).toHaveBeenCalledOnce();
    expect(mockSpinner.fail).toHaveBeenCalledWith(
      expect.stringContaining(mocktFn("errors.command.set_invalid_format")),
    );
  });

  it("should stop processing and throw if an update fails (e.g., validation error)", async () => {
    const values = ["lang", "en", "pm", "pnpm"];
    const validationError = new Error("Invalid package manager value.");

    mockHandleNonInteractiveSettingsUpdate.mockResolvedValueOnce(undefined);
    mockHandleNonInteractiveSettingsUpdate.mockRejectedValueOnce(
      validationError,
    );

    await expect(handleSetAction(values, false, mockSpinner)).rejects.toThrow(
      validationError,
    );

    expect(mockHandleNonInteractiveSettingsUpdate).toHaveBeenCalledTimes(2);

    expect(mockSpinner.succeed).not.toHaveBeenCalled();
    expect(mockSpinner.fail).not.toHaveBeenCalled();
  });
});
