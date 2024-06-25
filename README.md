# winston-cloudwatch-logger-config

A simple and configurable Winston logger setup for Node.js applications, supporting AWS CloudWatch integration. This library allows you to manage multiple log streams dynamically via a JSON configuration file.

## Features

- Dynamic Configuration: Easily configure log streams and settings via a JSON file.
- AWS CloudWatch Integration: Seamlessly logs messages to AWS CloudWatch.
- Multiple Log Streams: Supports multiple log streams for different services or components.
- JSON Logging Format: Logs messages in JSON format for easy parsing and analysis.

## Installation

Install the library using npm:

```npm install @axai/winston-cloudwatch-logger-config```

## Configuration

Create a .logger-config.json file in the root of your project. This file will contain your log group name, log streams, and AWS region.

Example logger-config.json

```json
{
  "logStreams": [
    {
      "logGroupName": "yourLogGroupName", // the default type of logging is Cloudwatch
      "logStreamName": "yourLogStreamName",
      "awsRegion": "yourAwsRegion",
      "level": "error"
    },
    {
      "logGroupName": "file", // but you can also specify "file" to log to a file
      "logStreamName": "info",
      "level": "error",
      "path": "/path/to/your/log/file.log"
    },
    {
      "logGroupName": "console", // or "console" to log to the console
      "logStreamName": "console"
    }
  ]
}
```

- `accessKeyId`: Your AWS access key ID.
- `secretAccessKey`: Your AWS secret access key.
- `logGroupName`: The name of the CloudWatch log group, or the special values "file" or "console" to log to a file or the console.
- `logStreams`: An array of log stream configurations, each with a name and level.
- `awsRegion`: The AWS region where your CloudWatch log group is located.
- `level`: The log level for the stream (e.g., "error", "info", "debug").
- `path`: The path to the log file when logging to a file.

## Usage

Import the logger object from the library and use the loggers for different services or components based on the configured log streams.

Ensure your logger-config.json is in the root directory of your project.

Use the loggers in your application:

```javascript
import loggers from "winston-cloudwatch-logger-config";

logger.forEach((logger) => {
  logger.info("This is an info message");
  logger.error("This is an error message");
});

loggers.yourLogGroupName.info("This is a CloudWatch log message");
```

## Environment Variables

Alternatively, if it is more convenient for your environment, you can set AWS credentials using environment variables, which will be used in the event that they are not specified in the logger-config.json file:

## Additional Notes

- The loggers object will contain a logger for each configured log stream.
- Ensure your AWS credentials and region are correctly set in the JSON file to allow proper logging to CloudWatch.
- The JSON configuration approach allows for easy management and flexibility, especially when dealing with multiple log streams and dynamic environments.

## Release Notes (0.2.0)

The loggers object now includes a LogFactory method which creates logs in a given format.

## Usage example:

```javascript
loggers.yourLogGroupName.info(loggers.LogFactory("info", { message: "This is an info message" }););
```

## License

Copyright AX-AI LTD 2024. ISC License. See LICENSE file for details.
