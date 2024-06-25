import libWinston from "winston";
import libWinstonCloudwatch from "winston-cloudwatch";
import { returnInstanceOrFactory } from "instance-or-factory";
import configuration from "./configLoader.js";
import LogFactory from "./LogFactory.js";

/**
 * Factory function that creates and returns a set of loggers based on the provided configuration.
 *
 * @param {Object} args - The arguments object.
 * @param {Object} args.config - The configuration object.
 * @param {Object} args.winston - The Winston library.
 * @param {Object} args.WinstonCloudwatch - The Winston Cloudwatch transport.
 *
 * @returns {Object} An object containing the created loggers.
 *
 */
const LoggersFactory = ({ config, winston, WinstonCloudwatch }) => {
  try {
    const createLogger = (stream) => {
      if (stream.logGroupName === "file")
        return winston.createLogger({
          level: stream.level,
          format: winston.format.json(),
          transports: [
            new winston.transports.File({
              filename: stream.path,
            }),
          ],
        });

      if (stream.logGroupName === "console")
        return winston.createLogger({
          level: stream.level,
          format: winston.format.json(),
          transports: [new winston.transports.Console()],
        });

      // Use the CloudWatch transport by default
      return winston.createLogger({
        level: stream.level,
        format: winston.format.json(),
        transports: [
          new WinstonCloudwatch({
            ...stream,
            awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
            awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
          }),
        ],
      });
    };

    // Create loggers for each log stream
    const loggers = config.logStreams.reduce((acc, stream) => {
      acc[stream.logStreamName] = createLogger(stream);
      return acc;
    }, {});

    loggers.LogFactory = LogFactory;

    return loggers;
  } catch (error) {
    throw new Error(`Error creating loggers: ${error.message}`);
  }
};

// Handling async export
const instanceOrFactory = await returnInstanceOrFactory({
  factory: LoggersFactory,
  args: {
    config: configuration,
    winston: libWinston,
    WinstonCloudwatch: libWinstonCloudwatch,
  },
});

export default instanceOrFactory;
