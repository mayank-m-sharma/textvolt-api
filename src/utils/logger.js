import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const __dirname = path.resolve();

const logDir = path.join(__dirname, '../logs');

const transport = new DailyRotateFile({
  dirname: logDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '14d',
  level: 'info',
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [transport],
});

logger.add(new winston.transports.Console());