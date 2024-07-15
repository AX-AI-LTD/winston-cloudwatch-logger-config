import { returnInstanceOrFactory } from "instance-or-factory";
import fsInstance from "node:fs";
import pathInstance from "node:path";

/**
 * ConfigFactory is an async factory function that loads and returns the logger configuration from a .logger-config.json file.
 * @param {Object} param0 - An object containing the dependencies for the function.
 * @param {Object} param0.Fs - The Node.js fs module.
 * @param {Object} param0.Path - The Node.js path module.
 * @returns {Promise<Object>} A promise that resolves with the loaded configuration.
 * @throws {Error} Will throw an error if the configuration file does not exist or if the logStreams configuration is missing or empty.
 */
const ConfigFactory = async ({ fs, path }) => {
  const configPath = path.resolve(process.cwd(), ".logger-config.json");
  console.log("configPath: ", configPath);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  if (!config || !config.logStreams || config.logStreams.length === 0) {
    throw new Error(
      "Missing required logstreams configuration for logger. Please check your logger-config.json file or see the documentation for more information.",
    );
  }

  return config;
};

const instanceOrFactory = await returnInstanceOrFactory({
  factory: ConfigFactory,
  args: { fs: fsInstance, path: pathInstance },
});

export default instanceOrFactory;
