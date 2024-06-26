import { describe, it, expect, vi, beforeEach } from "vitest";
import LoggersFactory from "./src/index.js";

describe("LoggersFactory", () => {
  const mockConfig = {
    logStreams: [
      {
        logGroupName: "file",
        level: "info",
        path: "logfile.log",
        logStreamName: "fileLogger",
      },
      {
        logGroupName: "console",
        level: "debug",
        logStreamName: "consoleLogger",
      },
      {
        logGroupName: "cloudwatch",
        level: "error",
        logStreamName: "cloudwatchLogger",
      },
    ],
    keys: {
      accessKeyId: "testAccessKeyId",
      secretAccessKey: "testSecretAccessKey",
    },
  };

  const mockWinston = {
    createLogger: vi.fn(),
    format: {
      json: vi.fn(),
    },
    transports: {
      File: vi.fn(),
      Console: vi.fn(),
    },
  };

  const mockWinstonCloudwatch = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should create file logger", () => {
    const fileTransport = {};
    const logger = { log: vi.fn() };
    mockWinston.transports.File.mockReturnValue(fileTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
    });

    expect(loggers.fileLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "info",
      format: mockWinston.format.json(),
      transports: [fileTransport],
    });
  });

  it("should create console logger", () => {
    const consoleTransport = {};
    const logger = { log: vi.fn() };
    mockWinston.transports.Console.mockReturnValue(consoleTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
    });

    expect(loggers.consoleLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "debug",
      format: mockWinston.format.json(),
      transports: [consoleTransport],
    });
  });

  it("should create cloudwatch logger", () => {
    const cloudwatchTransport = {};
    const logger = { log: vi.fn() };
    mockWinstonCloudwatch.mockReturnValue(cloudwatchTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
    });

    expect(loggers.cloudwatchLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "error",
      format: mockWinston.format.json(),
      transports: [cloudwatchTransport],
    });
  });

  it("should throw error if logger creation fails", () => {
    const faultyConfig = { ...mockConfig, logStreams: null };
    
    expect(() =>
      LoggersFactory({
        config: faultyConfig,
        winston: mockWinston,
        WinstonCloudwatch: mockWinstonCloudwatch,
      })
    ).toThrow(
      "Error creating loggers: Cannot read properties of null (reading 'reduce')"
    );
  });
});
