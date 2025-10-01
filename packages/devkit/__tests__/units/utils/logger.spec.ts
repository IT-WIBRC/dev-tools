import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  type MockInstance,
  beforeAll,
  afterAll,
  type MockedFunction,
} from "vitest";
import { logger } from "../../../src/utils/logger.js";

const MOCK_TIME = "10:00:00";
const MOCK_TIMESTAMP = `[dim] [${MOCK_TIME}]`;

const { mockChalk, mockOra } = vi.hoisted(() => {
  type MockColorFn = MockedFunction<(msg: string) => string>;

  const createColorMock = (name: string): MockColorFn =>
    vi.fn((m) => `[${name}] ${m}`) as MockColorFn;

  const simpleMocks = {
    blue: createColorMock("blue"),
    green: createColorMock("green"),
    yellow: createColorMock("yellow"),
    red: createColorMock("red"),
    cyan: createColorMock("cyan"),
    dim: createColorMock("dim"),
    bold: createColorMock("bold"),
    italic: createColorMock("italic"),
    redBright: createColorMock("redBright"),
    greenBright: createColorMock("greenBright"),
    magenta: createColorMock("magenta"),
    magentaBright: createColorMock("magentaBright"),
    white: createColorMock("white"),
  };

  const compositeMocks = {
    boldRed: createColorMock("bold_red"),
    boldBlue: createColorMock("bold_blue"),
    boldYellow: createColorMock("bold_yellow"),
    cyanDim: createColorMock("cyan_dim"),
  };

  const timestampDimMock = vi.fn((m) => `[dim] ${m}`) as MockColorFn;

  const boldMock = simpleMocks.bold as unknown as MockColorFn & {
    red: MockColorFn;
    blue: MockColorFn;
    yellow: MockColorFn;
  };
  boldMock.red = compositeMocks.boldRed;
  boldMock.blue = compositeMocks.boldBlue;
  boldMock.yellow = compositeMocks.boldYellow;

  const cyanMock = simpleMocks.cyan as unknown as MockColorFn & {
    dim: MockColorFn;
  };
  cyanMock.dim = compositeMocks.cyanDim;

  const mockChalk = {
    ...simpleMocks,
    dim: timestampDimMock,
    bold: boldMock,
    cyan: cyanMock,
    boldRed: compositeMocks.boldRed,
    boldBlue: compositeMocks.boldBlue,
    boldYellow: compositeMocks.boldYellow,
    cyanDim: compositeMocks.cyanDim,
  };

  mockChalk.blue = simpleMocks.blue;
  mockChalk.green = simpleMocks.green;
  mockChalk.yellow = simpleMocks.yellow;
  mockChalk.red = simpleMocks.red;
  mockChalk.redBright = simpleMocks.redBright;

  return {
    mockChalk: mockChalk,
    mockOra: vi.fn((text) => ({
      text: text,
      start: vi.fn(),
      stop: vi.fn(),
      succeed: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      fail: vi.fn(),
    })),
  };
});

vi.mock("chalk", () => ({ default: mockChalk }));
vi.mock("ora", () => ({ default: mockOra }));

describe("logger utility", () => {
  let mockConsoleLog: MockInstance;
  let mockConsoleError: MockInstance;
  let timestampDimMock: MockInstance;

  beforeAll(() => {
    vi.unmock("#utils/logger.js");

    vi.useFakeTimers();
    vi.setSystemTime(new Date(`2024-01-01T${MOCK_TIME}`));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    timestampDimMock = mockChalk.dim as MockInstance;
    timestampDimMock.mockImplementation((m: string) => `[dim] ${m}`);
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
  });

  it("success() should call console.log with green checkmark and a newline", () => {
    const message = "Operation successful";
    logger.success(message);

    expect(mockChalk.green).toHaveBeenCalledWith(`\n✔ ${message}`);
    expect(mockConsoleLog).toHaveBeenCalledWith(`[green] \n✔ ${message}`);
  });

  it("error() should call console.error with timestamp, type tag, and redBright message", () => {
    const message = "File access denied";
    const errorType = "CONFIG";
    logger.error(message, errorType);

    expect(timestampDimMock).toHaveBeenCalledWith(`[${MOCK_TIME}]`);
    expect(mockChalk.bold.red).toHaveBeenCalledWith(
      `❌${MOCK_TIMESTAMP}::[${errorType}]`,
    );

    expect(mockChalk.redBright).toHaveBeenCalledWith(`${message}`);

    const expectedOutput = `[bold_red] ❌${MOCK_TIMESTAMP}::[${errorType}]>> [redBright] ${message}`;
    expect(mockConsoleError).toHaveBeenCalledWith(expectedOutput);
  });

  it("spinner() should call ora with the provided text", () => {
    const text = "Loading data...";
    const spinnerInstance = logger.spinner(text);

    expect(mockOra).toHaveBeenCalledWith(text);
    expect(spinnerInstance.start).toBeInstanceOf(Function);
  });

  describe("table() utility", () => {
    it("should calculate widths and log correctly aligned, colored strings and a separator", () => {
      const testData = [
        [logger.colors.bold("Header1"), logger.colors.boldBlue("Header2")],
        [
          logger.colors.green("Short"),
          logger.colors.cyanDim("A very long colored string"),
        ],
        [logger.colors.dim("Longer row"), logger.colors.white("Short")],
      ];

      logger.table(testData);

      const expectedLine1 = `[bold] Header1     [bold_blue] Header2                   `;

      const expectedTotalWidth = 56;
      const expectedLine2 = `[dim] ${"-".repeat(expectedTotalWidth)}`;

      const expectedLine3 = `[green] Short      [cyan_dim] A very long colored string   `;

      const expectedLine4 = `[dim] Longer row   [white] Short                     `;

      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(
        1,
        expectedLine1.trimEnd(),
      );
      expect(mockConsoleLog).toHaveBeenNthCalledWith(2, expectedLine2);
      expect(mockConsoleLog).toHaveBeenNthCalledWith(
        3,
        expectedLine3.trimEnd(),
      );
      expect(mockConsoleLog).toHaveBeenNthCalledWith(
        4,
        expectedLine4.trimEnd(),
      );
    });

    it("should handle empty or single row data by doing nothing", () => {
      logger.table([]);
      logger.table([[]]);
      logger.table([[], []]);
      logger.table([["Header"]]);
      logger.table([["H1", "H2"]]);

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  it("dimmed() should call console.log with dim chalk and trim the message", () => {
    const message = "  Extra details...  ";
    logger.dimmed(message);

    expect(timestampDimMock).toHaveBeenCalledWith(message.trim());
    expect(mockConsoleLog).toHaveBeenCalledWith(`[dim] Extra details...`);
  });

  it("error() should default to 'UNKNOWN' type", () => {
    const message = "Generic error";
    logger.error(message);

    expect(mockChalk.bold.red).toHaveBeenCalledWith(
      `❌[dim] [10:00:00]::[UNKNOWN]`,
    );
  });

  describe("Colors object", () => {
    const colors = logger.colors;
    const testString = "Test";

    it("should have all specified color methods and return mocked strings", () => {
      expect(colors.white(testString)).toBe(`[white] ${testString}`);
      expect(colors.blue(testString)).toBe(`[blue] ${testString}`);
      expect(colors.green(testString)).toBe(`[green] ${testString}`);
      expect(colors.yellow(testString)).toBe(`[yellow] ${testString}`);
      expect(colors.red(testString)).toBe(`[red] ${testString}`);
      expect(colors.cyan(testString)).toBe(`[cyan] ${testString}`);
      expect(colors.dim(testString)).toBe(`[dim] ${testString}`);
      expect(colors.bold(testString)).toBe(`[bold] ${testString}`);
      expect(colors.italic(testString)).toBe(`[italic] ${testString}`);
      expect(colors.redBright(testString)).toBe(`[redBright] ${testString}`);
      expect(colors.greenBright(testString)).toBe(
        `[greenBright] ${testString}`,
      );
      expect(colors.magenta(testString)).toBe(`[magenta] ${testString}`);
      expect(colors.magentaBright(testString)).toBe(
        `[magentaBright] ${testString}`,
      );

      expect(colors.boldBlue(testString)).toBe(`[bold_blue] ${testString}`);
      expect(colors.cyanDim(testString)).toBe(`[cyan_dim] ${testString}`);
      expect(colors.yellowBold(testString)).toBe(`[bold_yellow] ${testString}`);
    });
  });
});
