import { describe, it, expect, beforeEach, vi } from "vitest";
import getConfig from "./src/configLoader.js";

const mockFs = {
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
};

const mockPath = {
  resolve: vi.fn(),
};

describe("getConfig", () => {
  const mockConfigPath = "/mocked/path/.logger-config.json";
  const mockConfigContent = JSON.stringify({
    logStreams: [
      { logGroupName: "console", level: "info" },
      { logGroupName: "file", level: "error", path: "./error.log" },
    ],
    keys: {
      accessKeyId: "your-access-key-id",
      secretAccessKey: "your-secret-access-key",
    },
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should load configuration from a JSON file", async () => {
    mockFs.readFileSync.mockReturnValue(mockConfigContent);
    mockFs.existsSync.mockReturnValue(true);
    mockPath.resolve.mockReturnValue(mockConfigPath);

    const config = await getConfig({ fs: mockFs, path: mockPath });

    expect(config).toEqual(JSON.parse(mockConfigContent));
  });

  it("should throw an error if the configuration file is not found", async () => {
    mockFs.existsSync.mockReturnValue(false);
    mockPath.resolve.mockReturnValue(mockConfigPath);

    await expect(
      getConfig({ fs: mockFs, path: mockPath })
    ).rejects.toThrowError(`Configuration file not found: ${mockConfigPath}`);
  });

  it("should throw an error if the logStreams configuration is missing", async () => {
    const invalidConfigContent = JSON.stringify({});
    mockFs.readFileSync.mockReturnValue(invalidConfigContent);
    mockFs.existsSync.mockReturnValue(true);
    mockPath.resolve.mockReturnValue(mockConfigPath);

    await expect(
      getConfig({ fs: mockFs, path: mockPath })
    ).rejects.toThrowError(
      "Missing required logstreams configuration for logger. Please check your logger-config.json file or see the documentation for more information."
    );
  });
});
