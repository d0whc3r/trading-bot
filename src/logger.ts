// @ts-ignore
import logdnaWinston from 'logdna-winston';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { Config } from './config';

export const LOG_PATH = 'logs';

export const dateConfig = {
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
};

export const transportFileError = !Config.IS_TEST && new winston.transports.DailyRotateFile({
  filename: path.join(LOG_PATH, 'error-%DATE%.log'),
  level: 'error',
  ...dateConfig
});
export const transportFile = !Config.IS_TEST && new winston.transports.DailyRotateFile({
  filename: path.join(LOG_PATH, 'app-%DATE%.log'),
  ...dateConfig
});
export const transportConsole = new winston.transports.Console({
  // format: winston.format.simple(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  level: Config.IS_TEST ? 'debug' : 'info'
});
export const transportLogdnaWinston = !Config.IS_TEST && Config.LOGGER_LOGDNA_KEY && new logdnaWinston({
  key: Config.LOGGER_LOGDNA_KEY,
  hostname: 'd0w',
  app: 'trading-bot',
  env: Config.NODE_ENV,
  level: 'debug',
  indexMeta: true,
  handleExceptions: true
});

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [transportFileError, transportFile, transportLogdnaWinston].filter(Boolean)
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(transportConsole);
}

export { logger };
