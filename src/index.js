import libWinston from "winston";
import libWinstonCloudwatch from "winston-cloudwatch";
import { returnInstanceOrFactory } from "instance-or-factory";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  CreateLogGroupCommand,
  DescribeLogStreamsCommand,
  CreateLogStreamCommand,
} from "@aws-sdk/client-cloudwatch-logs"; // AWS SDK v3
import configuration from "./configLoader.js";
import LogFactory from "./LogFactory.js";

const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION,
});

/**
 * Ensures that the specified CloudWatch log group exists, and creates it if it does not.
 *
 * @param {string} logGroupName - The name of the log group.
 */
async function ensureLogGroupExists(logGroupName) {
  try {
    const describeLogGroupsCommand = new DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName,
    });
    const describeResponse = await cloudWatchLogsClient.send(
      describeLogGroupsCommand,
    );
    const logGroupExists = describeResponse.logGroups.some(
      (group) => group.logGroupName === logGroupName,
    );

    if (!logGroupExists) {
      const createLogGroupCommand = new CreateLogGroupCommand({ logGroupName });
      await cloudWatchLogsClient.send(createLogGroupCommand);
      console.log(`CloudWatch Log Group created: ${logGroupName}`);
    } else {
      console.log(`CloudWatch Log Group already exists: ${logGroupName}`);
    }
  } catch (error) {
    if (error.name !== "ResourceAlreadyExistsException") {
      console.error(`Error ensuring log group exists: ${error.message}`);
      throw new Error(`Error ensuring log group exists: ${error.message}`);
    }
  }
}

/**
 * Ensures that the specified CloudWatch log stream exists within a log group, and creates it if it does not.
 *
 * @param {string} logGroupName - The name of the log group.
 * @param {string} logStreamName - The name of the log stream.
 */
async function ensureLogStreamExists(logGroupName, logStreamName) {
  try {
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      logStreamNamePrefix: logStreamName,
    });
    const describeResponse = await cloudWatchLogsClient.send(
      describeLogStreamsCommand,
    );
    const logStreamExists = describeResponse.logStreams.some(
      (stream) => stream.logStreamName === logStreamName,
    );

    if (!logStreamExists) {
      const createLogStreamCommand = new CreateLogStreamCommand({
        logGroupName,
        logStreamName,
      });
      await cloudWatchLogsClient.send(createLogStreamCommand);
      console.log(`CloudWatch Log Stream created: ${logStreamName}`);
    } else {
      console.log(`CloudWatch Log Stream already exists: ${logStreamName}`);
    }
  } catch (error) {
    if (error.name !== "ResourceAlreadyExistsException") {
      console.error(`Error ensuring log stream exists: ${error.message}`);
      throw new Error(`Error ensuring log stream exists: ${error.message}`);
    }
  }
}

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
const LoggersFactory = async ({ config, winston, WinstonCloudwatch }) => {
  try {
    const createLogger = async (stream) => {
      if (stream.logGroupName === "file") {
        console.log(`Creating file logger for path: ${stream.path}`);
        return winston.createLogger({
          level: stream.level,
          format: winston.format.json(),
          transports: [
            new winston.transports.File({
              filename: stream.path,
            }),
          ],
        });
      }

      if (stream.logGroupName === "console") {
        console.log(`Creating console logger`);
        return winston.createLogger({
          level: stream.level,
          format: winston.format.json(),
          transports: [new winston.transports.Console()],
        });
      }

      // Ensure log group and log stream exist if not using file or console
      await ensureLogGroupExists(stream.logGroupName);
      await ensureLogStreamExists(stream.logGroupName, stream.logStreamName);

      // Log stream details for debugging
      console.log(
        `Creating CloudWatch logger for group: ${stream.logGroupName}, stream: ${stream.logStreamName}`,
      );

      // Use the CloudWatch transport
      return winston.createLogger({
        level: stream.level,
        format: winston.format.json(),
        transports: [
          new WinstonCloudwatch({
            logGroupName: stream.logGroupName,
            logStreamName: stream.logStreamName,
            awsRegion: process.env.AWS_REGION,
            awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
            awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }),
        ],
      });
    };

    // Create loggers for each log stream
    const loggers = await Promise.all(
      config.logStreams.map(async (stream) => {
        const logger = await createLogger(stream);
        return { [stream.logStreamName]: logger };
      }),
    );

    const loggersObject = Object.assign({}, ...loggers);
    loggersObject.LogFactory = LogFactory;

    return loggersObject;
  } catch (error) {
    console.error(`Error creating loggers: ${error.message}`);
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

try {
  const testLoggers = await instanceOrFactory;
  const testLogger = testLoggers[0]; //
  testLogger.info("Cloudwatch logging initialized successfully!");
} catch (error) {
  console.error(`Error during logging test: ${error.message}`);
}
