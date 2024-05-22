import { describe, it, expect, vi, beforeEach } from "vitest";
import LoggersFactory from "./src/index.js";

describe("LoggersFactory", () => {
  let mockConfig;
  let mockGetConfig;
  let mockWinston;
  let mockWinstonCloudwatch;

  beforeEach(() => {
    mockConfig = {
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

    mockWinston = {
      createLogger: vi.fn().mockReturnValue({
        fileLogger: {},
        consoleLogger: {},
        cloudwatchLogger: {},
      }),
      format: {
        json: vi.fn(),
      },
      transports: {
        File: vi.fn(),
        Console: vi.fn(),
      },
    };

    mockWinstonCloudwatch = vi.fn();

    mockGetConfig = vi.fn();
    mockGetConfig.mockReturnValue(mockConfig);
  });

  it("should create file logger", () => {
    const fileTransport = { filename: "logfile.log" };
    mockWinston.transports.File.mockReturnValue(fileTransport);

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
    mockWinston.transports.Console.mockReturnValue(consoleTransport);

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
    mockWinstonCloudwatch.mockReturnValue(cloudwatchTransport);

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
