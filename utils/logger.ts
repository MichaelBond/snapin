// logger.js
import { createLogger, format, transports } from "winston"
import { getRequestId } from '../middleware/requestIdMiddleware';

export default createLogger({
  level: 'info',  // Default log level
  format: format.combine(
    format.timestamp(),        // Add timestamps to logs
    format.printf(({ timestamp, level, message }) => {
      const requestId = getRequestId(); // Get the current request ID
      return `${timestamp} [${level}] ${requestId ? `[Request ID: ${requestId}]` : ''} ${message}`;
    }),
    format.errors({ stack: true }), // Include stack trace if available
    format.json(),              // Log in JSON format
  ),
  transports: [
    new transports.Console({    // Console output
      format: format.combine(
        format.colorize(),      // Colorize output for readability
        format.simple(),
        format.printf(({ timestamp, level, message }) => {
          const requestId = getRequestId(); // Get the current request ID
          return `${timestamp} [${level}] ${requestId ? `[Request ID: ${requestId}]` : ''} ${message}`;
        }),
        format.errors({ stack: true }), // Include stack trace if available
      )
    }),
    new transports.File({       // File output
      filename: process.env.LOGGER_FILE || "app.log"
    })
  ],
});
