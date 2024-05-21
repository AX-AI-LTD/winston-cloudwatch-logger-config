import winston from "winston";
import { getConfig } from "./configLoader.js";
import WinstonCloudwatch from "winston-cloudwatch";

const config = getConfig();

const createLogger = (stream, keys) => {
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

  return winston.createLogger({
    level: stream.level,
    format: winston.format.json(),
    transports: [
      new WinstonCloudwatch({
        ...stream,
        awsAccessKeyId: keys.accessKeyId,
        awsSecretKey: keys.secretAccessKey,
      }),
    ],
  });
};

// Create loggers for each log stream
const loggers = config.logStreams.reduce((acc, stream) => {
  acc[stream.logStreamName] = createLogger(stream, config.keys);
  return acc;
}, {});

export default loggers;
