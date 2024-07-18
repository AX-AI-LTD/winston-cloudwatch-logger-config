import dotenv from "dotenv";
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

dotenv.config();

/**
 * Ensures that the specified CloudWatch log group exists, and creates it if it does not.
 *
 * @param {string} logGroupName - The name of the log group.
 */
const ensureLogGroupExists = async ({ logGroupName, cloudWatchLogsClient, awsSdk }) => {
  try {
    const describeLogGroupsCommand = new awsSdk.DescribeLogGroupsCommand({
      logGroupNamePrefix: logGroupName,
    });
    const describeResponse = await cloudWatchLogsClient.send(
      describeLogGroupsCommand
    );
    const logGroupExists = describeResponse.logGroups && describeResponse.logGroups.some(
      (group) => group.logGroupName === logGroupName
    );

    if (logGroupExists) {
      console.log(`CloudWatch Log Group already exists: ${logGroupName}`);
      return;
    }
    const createLogGroupCommand = new CreateLogGroupCommand({ logGroupName });
    await cloudWatchLogsClient.send(createLogGroupCommand);
    console.log(`CloudWatch Log Group created: ${logGroupName}`);
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
const ensureLogStreamExists = async ({
  logGroupName,
  logStreamName,
  cloudWatchLogsClient,
  awsSdk
}) => {
  try {
    const describeLogStreamsCommand = new awsSdk.DescribeLogStreamsCommand({
      logGroupName,
      logStreamNamePrefix: logStreamName,
    });
    const describeResponse = await cloudWatchLogsClient.send(
      describeLogStreamsCommand
    );
    const logStreamExists = describeResponse.logStreams.some(
      (stream) => stream.logStreamName === logStreamName
    );

    if (logStreamExists) {
      console.log(`CloudWatch Log Stream already exists: ${logStreamName}`);
      return;
    }
    const createLogStreamCommand = new awsSdk.CreateLogStreamCommand({
      logGroupName,
      logStreamName,
    });
    await cloudWatchLogsClient.send(createLogStreamCommand);
    console.log(`CloudWatch Log Stream created: ${logStreamName}`);
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
const LoggersFactory = async ({ config, winston, WinstonCloudwatch, awsSdk }) => {
  try {
    console.log("config: ", config);
    const cloudWatchLogsClient = new awsSdk.CloudWatchLogsClient({
      region: config.application.awsRegion,
    });
    const createLogger = async (stream) => {
      if (stream.logGroupName === "file") {
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
        return winston.createLogger({
          level: stream.level,
          format: winston.format.json(),
          transports: [new winston.transports.Console()],
        });
      }

      // Ensure log group and log stream exist if not using file or console
      await ensureLogGroupExists({
        logGroupName: stream.logGroupName,
        cloudWatchLogsClient,
        awsSdk
      });
      await ensureLogStreamExists({
        logGroupName: stream.logGroupName,
        logStreamName: stream.logStreamName,
        cloudWatchLogsClient,
        awsSdk
      });

      const cloudWatchOptions = {
        logGroupName: stream.logGroupName,
        logStreamName: stream.logStreamName,
        awsRegion: config.application.awsRegion,
      };

      // Conditionally add AWS credentials if they are defined
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        cloudWatchOptions.awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        cloudWatchOptions.awsSecretAccessKey =
          process.env.AWS_SECRET_ACCESS_KEY;
      }

      console.log("cloudWatchOptions: ", cloudWatchOptions);
      
      return winston.createLogger({
        level: stream.level,
        format: winston.format.json(),
        transports: [new WinstonCloudwatch(cloudWatchOptions)],
      });
    };

    // Create loggers for each log stream consecutively so that we don't create a conflict in AWS when trying to create log groups and streams
    const loggersObject = {};
    for (let i = 0; i < config.logStreams.length; i += 1) {
      const stream = config.logStreams[i];
      // eslint-disable-next-line no-await-in-loop
      const logger = await createLogger(stream);
      loggersObject[stream.logStreamName] = logger;
    }

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
    awsSdk: {
      CloudWatchLogsClient,
      DescribeLogGroupsCommand,
      CreateLogGroupCommand,
      DescribeLogStreamsCommand,
      CreateLogStreamCommand,
    },
  },
});

export default instanceOrFactory;

try {
  const testLoggers = await instanceOrFactory;
  testLoggers.application.info("Cloudwatch logging initialized successfully!");
} catch (error) {
  console.error(`Error during logging test: ${error.message}`);
}
