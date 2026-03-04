import winston from "winston";
import fs from "fs";
import morgan from "morgan";

const logsDir = "logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: `${logsDir}/error.log`,
      level: "error",
    }),
    new winston.transports.File({
      filename: `${logsDir}/combined.log`,
      level: "combined",
    }),
    new winston.transports.File({
      filename: `${logsDir}/debug.log`,
      level: "debug",
    }),
  ],
});

export const morganMessage = (message) => {
  logger.info(message);
};
