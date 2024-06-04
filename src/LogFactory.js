import nodeFs from "node:fs/promises"; // Use promises API
import nodePath from "node:path";

/**
 * Factory function to create a log entry.
 *
 * @param {string} level - The log level (e.g., 'info', 'warn', 'error').
 * @param {Object} [properties={}] - Additional properties to include in the log entry.
 * @returns {Object} The log entry, which includes a timestamp, the log level, application information, and any additional properties.
 */
const LogFactory = async (level, properties = {}, fs = nodeFs, path = nodePath) => {
  try {
    // Load the configuration file
    const configPath = path.resolve(process.cwd(), ".logger-config.json");
    const configFile = await fs.readFile(configPath, "utf8"); // Await the promise
    const config = JSON.parse(configFile);
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      application: {
        name: config.application.name,
        version: config.application.version,
      },
      ...properties,
    };

    return logEntry;
  } catch (error) {
    throw new Error(`Error creating log entry: ${error.message}`);
  }
};

export default LogFactory;
