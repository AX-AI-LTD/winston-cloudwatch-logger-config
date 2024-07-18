import { describe, it, expect, vi, beforeEach } from "vitest";
import LoggersFactory from "./src/index.js";

const mockAwsSdk = {
  CloudWatchLogsClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      logGroups: [],
      logStreams: [],
    }),
  })),
  DescribeLogGroupsCommand: vi.fn().mockImplementation(() => ({})),
  CreateLogGroupCommand: vi.fn().mockImplementation(() => ({})),
  DescribeLogStreamsCommand: vi.fn().mockImplementation(() => ({})),
  CreateLogStreamCommand: vi.fn().mockImplementation(() => ({})),
};

describe("LoggersFactory", () => {
  process.env.AWS_ACCESS_KEY_ID = "mockAccessKeyId";
  process.env.AWS_SECRET_ACCESS_KEY = "mockSecretAccessKey";
  process.env.AWS_REGION = "us-east-1";
  const mockConfig = {
    application: {
      awsRegion: "us-east-1",
    },
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
    vi.clearAllMocks();
  });

  it.skip("should create file logger", async () => {
    const fileTransport = {};
    const logger = { log: vi.fn() };
    mockWinston.transports.File.mockReturnValue(fileTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = await LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
      awsSdk: mockAwsSdk,
    });

    expect(loggers.fileLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "info",
      format: mockWinston.format.json(),
      transports: [fileTransport],
    });
  });

  it.skip("should create console logger", async () => {
    const consoleTransport = {};
    const logger = { log: vi.fn() };
    mockWinston.transports.Console.mockReturnValue(consoleTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = await LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
      awsSdk: mockAwsSdk,
    });

    expect(loggers.consoleLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "debug",
      format: mockWinston.format.json(),
      transports: [consoleTransport],
    });
  });

  it("should create cloudwatch logger", async () => {
    const cloudwatchTransport = {};
    const logger = { log: vi.fn() };
    mockWinstonCloudwatch.mockReturnValue(cloudwatchTransport);
    mockWinston.createLogger.mockReturnValue(logger);

    const loggers = await LoggersFactory({
      config: mockConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
      awsSdk: mockAwsSdk,
    });

    expect(loggers.cloudwatchLogger).toBeDefined();
    expect(mockWinston.createLogger).toHaveBeenCalledWith({
      level: "error",
      format: mockWinston.format.json(),
      transports: [cloudwatchTransport],
    });
    expect(mockAwsSdk.CloudWatchLogsClient).toHaveBeenCalledWith({
      region: "us-east-1",
    });
    expect(mockAwsSdk.DescribeLogGroupsCommand).toHaveBeenCalled();
    // expect(mockAwsSdk.CreateLogGroupCommand).toHaveBeenCalled();
    expect(mockAwsSdk.DescribeLogStreamsCommand).toHaveBeenCalled();
    expect(mockAwsSdk.CreateLogStreamCommand).toHaveBeenCalled();
  });

  it.skip("should throw error if logger creation fails", async () => {
    const faultyConfig = { ...mockConfig, logStreams: null };
    await expect(LoggersFactory({
      config: faultyConfig,
      winston: mockWinston,
      WinstonCloudwatch: mockWinstonCloudwatch,
      awsSdk: mockAwsSdk,
    })).rejects.toThrow("Error creating loggers: Cannot read properties of null (reading 'length')");
  });
});
