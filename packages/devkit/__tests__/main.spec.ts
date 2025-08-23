import { vi, describe, it, expect } from "vitest";

const { mockSetupAndParse } = vi.hoisted(() => ({
  mockSetupAndParse: vi.fn(),
}));

vi.mock("../src/commands/index.js", () => ({
  setupAndParse: mockSetupAndParse,
}));

describe("CLI entry point", () => {
  it("should call setupAndParse to initialize and run the CLI", async () => {
    await import("../src/main.js");

    expect(mockSetupAndParse).toHaveBeenCalledTimes(1);
  });
});
