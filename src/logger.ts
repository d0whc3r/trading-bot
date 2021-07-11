// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logdnaWinston from 'logdna-winston';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { Config } from './config';
import DailyRotateFile = require('winston-daily-rotate-file');

export const LOG_PATH = 'logs';

export const dateConfig = {
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '3d'
};

export const transportFileDebug =
  !Config.IS_TEST &&
  new DailyRotateFile({
    filename: path.join(LOG_PATH, 'debug-%DATE%.log'),
    level: 'debug',
    ...dateConfig
  });
export const transportFileError =
  !Config.IS_TEST &&
  new DailyRotateFile({
    filename: path.join(LOG_PATH, 'error-%DATE%.log'),
    level: 'error',
    ...dateConfig
  });
export const transportFile =
  !Config.IS_TEST &&
  new DailyRotateFile({
    filename: path.join(LOG_PATH, 'app-%DATE%.log'),
    ...dateConfig
  });
export const transportConsole = new transports.Console({
  // format: winston.format.simple(),
  format: format.combine(format.timestamp(), format.json()),
  level: Config.IS_TEST ? 'debug' : 'info'
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const transportLogdnaWinston =
  !Config.IS_TEST &&
  Config.LOGGER_LOGDNA_KEY &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  new logdnaWinston({
    key: Config.LOGGER_LOGDNA_KEY,
    hostname: 'd0w',
    app: 'trading-bot',
    env: Config.NODE_ENV,
    level: 'debug',
    indexMeta: true,
    handleExceptions: true
  });

const logger = createLogger({
  level: 'debug',
  format: format.combine(format.timestamp(), format.json()),
  transports: [transportFileDebug, transportFileError, transportFile, transportLogdnaWinston].filter(Boolean)
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(transportConsole);
}

export { logger };
