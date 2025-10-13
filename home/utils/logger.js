// logger.js
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new transports.Console(),
  ]
});

logger.add(new DailyRotateFile({
  filename: '/logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
}));

export default logger;