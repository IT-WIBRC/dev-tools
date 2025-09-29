import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  type MockInstance,
  beforeAll,
} from "vitest";
import { logger } from "../../../src/utils/logger.js";

const { mockChalk, mockOra } = vi.hoisted(() => ({
  mockChalk: {
    blue: vi.fn((m) => `[blue] ${m}`),
    green: vi.fn((m) => `[green] ${m}`),
    yellow: vi.fn((m) => `[yellow] ${m}`),
    red: vi.fn((m) => `[red] ${m}`),
    dim: vi.fn((m) => `[dim] ${m}`),
  },
  mockOra: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    succeed: vi.fn(),
  })),
}));

vi.mock("chalk", () => ({ default: mockChalk }));
vi.mock("ora", () => ({ default: mockOra }));

describe("logger utility", () => {
  let mockConsoleLog: MockInstance;
  let mockConsoleError: MockInstance;

  beforeAll(() => {
    vi.unmock("#utils/logger.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it("info() should call console.log with blue chalk", () => {
    const message = "Application starting...";
    logger.info(message);

    expect(mockChalk.blue).toHaveBeenCalledOnce();
    expect(mockChalk.blue).toHaveBeenCalledWith(message);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[blue] ${message}`);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("success() should call console.log with green checkmark", () => {
    const message = "Operation successful";
    logger.success(message);

    expect(mockChalk.green).toHaveBeenCalledWith(`✔ ${message}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[green] ✔ ${message}`);
  });

  it("warning() should call console.log with yellow warning emoji", () => {
    const message = "Configuration missing";
    logger.warning(message);

    expect(mockChalk.yellow).toHaveBeenCalledWith(`⚠️ ${message}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[yellow] ⚠️ ${message}`);
  });

  it("error() should call console.error with red cross emoji and a newline", () => {
    const message = "File access denied";
    logger.error(message);

    expect(mockChalk.red).toHaveBeenCalledWith(`\n❌ ${message}`);
    expect(mockConsoleError).toHaveBeenCalledWith(`[red] \n❌ ${message}`);
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("log() should call console.log directly without chalk", () => {
    const message = "A plain log message";
    logger.log(message);

    expect(mockConsoleLog).toHaveBeenCalledWith(message);
    expect(mockChalk.blue).not.toHaveBeenCalled();
  });

  it("dimmed() should call console.log with dim chalk", () => {
    const message = "Extra details...";
    logger.dimmed(message);

    expect(mockChalk.dim).toHaveBeenCalledWith(message);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[dim] ${message}`);
  });

  it("spinner() should call ora with the provided text", () => {
    const text = "Loading data...";
    const spinnerInstance = logger.spinner(text);

    expect(mockOra).toHaveBeenCalledWith(text);
    expect(spinnerInstance.start).toBeInstanceOf(Function);
  });
});
