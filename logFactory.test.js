import { describe, it, expect, vi, beforeEach } from "vitest";
import LogFactory from "./src/LogFactory.js";

const mockFs = {
  readFile: vi.fn(),
};

const mockPath = {
  resolve: vi.fn(),
};

// Mock the configuration loading process
const mockConfig = {
  application: {
    name: "TestApp",
    version: "1.0.0",
  },
};

describe("LogFactory", () => {
  beforeEach(() => {
    // Reset the mocks before each test
    vi.restoreAllMocks();

    mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    mockPath.resolve.mockReturnValue(".logger-config.json");

    // Stub the Date object
    vi.useFakeTimers().setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  it("should create a log entry with the correct structure", async () => {
    const level = "info";
    const properties = { customProp: "example" };
    const expectedLogEntry = {
      timestamp: "2023-01-01T12:00:00.000Z",
      level,
      application: {
        name: "TestApp",
        version: "1.0.0",
      },
      customProp: "example",
    };

    const logEntry = await LogFactory(level, properties, mockFs, mockPath); // Make sure to await

    expect(logEntry).toEqual(expectedLogEntry);
  });

  it("should create a log entry with default properties when not provided", async () => {
    const level = "warn";
    const expectedLogEntry = {
      timestamp: "2023-01-01T12:00:00.000Z",
      level,
      application: {
        name: "TestApp",
        version: "1.0.0",
      },
    };

    const logEntry = await LogFactory(level, null, mockFs, mockPath); // Make sure to await

    expect(logEntry).toEqual(expectedLogEntry);
  });

  it("should throw an error if config file can't be read", async () => {
    mockFs.readFile.mockRejectedValue(new Error("File read error")); // Mock async rejection

    await expect(LogFactory("error", null, mockFs, mockPath)).rejects.toThrow(
      "File read error"
    );
  });

  it("should throw an error if config file is not a valid JSON", async () => {
    mockFs.readFile.mockResolvedValue("{ invalid json }"); // Mock promise

    await expect(LogFactory("error", null, mockFs, mockPath)).rejects.toThrow();
  });
});
