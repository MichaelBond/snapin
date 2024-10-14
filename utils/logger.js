// logger.js
import { createLogger, format, transports } from "winston"

export const logger = createLogger({
  level: 'info',  // Default log level
  format: format.combine(
    format.timestamp(),        // Add timestamps to logs
    format.errors({ stack: true }), // Include stack trace if available
    format.json()              // Log in JSON format
  ),
  transports: [
    new transports.Console({    // Console output
      format: format.combine(
        format.colorize(),      // Colorize output for readability
        format.simple()
      )
    }),
    new transports.File({       // File output
      filename: process.env.LOGGER_FILE || "app.log"
    })
  ],
});
