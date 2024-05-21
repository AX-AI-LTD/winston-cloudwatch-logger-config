import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new WinstonCloudWatch({
      logGroupName: "my-log-group",
      logStreamName: "my-log-stream",
      awsRegion: "us-east-1",
      jsonMessage: true,
      level: "info",
    }),
  ],
});

export default logger;