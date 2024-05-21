import fs from "node:fs";
import path from "node:path";

// Function to load configuration from a JSON file
export const getConfig = () => {
  const configPath = path.resolve(process.cwd(), ".logger-config.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  if (!config || config.logStreams.length === 0) {
    throw new Error(
      "Missing required logstreams configuration for logger. Please check your logger-config.json file or see the documentation for more information."
    );
  }

  return config;
};
