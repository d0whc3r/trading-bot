import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express, { Request } from 'express';
import expressWinston from 'express-winston';
import path from 'path';
import winston from 'winston';
import { Config } from './config';
import { dateConfig, LOG_PATH, logger } from './logger';
import { parsePetition } from './parser';
import type { SignalModel } from './types/signalModel.type';
import { version } from '../package.json';

process.on('uncaughtException', (error) => {
  logger.error({ title: 'Uncaught Exception', message: error.message, error });
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression());
app.use(cors());
app.use(
  expressWinston.logger({
    transports: [
      // new winston.transports.Console(),
      new winston.transports.DailyRotateFile({
        filename: path.join(LOG_PATH, 'server-%DATE%.log'),
        ...dateConfig
      })
    ],
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: true,
    msg: 'HTTP[{{req.method}}] {{req.url}} => {{req.body}}',
    expressFormat: true,
    colorize: false
  })
);

app.post(Config.MAIN_PATH, (req: Request<any, any, SignalModel>, res) => {
  const { body } = req;
  logger.debug({ title: 'NEW PETITION', body });
  if (!body || Config.SERVER_CODE !== body.code) {
    logger.error({ title: '[-] ERROR: Auth/Body', body });
    return res.status(401).send('error');
  }
  const { exchange, ticker, strategy } = body;
  void parsePetition({ ticker, exchange, strategy });
  return res.send('ok');
});

app.use(
  expressWinston.errorLogger({
    transports: [
      new winston.transports.DailyRotateFile({
        filename: path.join(LOG_PATH, 'server-error-%DATE%.log'),
        ...dateConfig
      })
    ],
    format: winston.format.combine(winston.format.colorize(), winston.format.json())
  })
);

app.listen(Config.PORT, Config.HOST, () => {
  logger.info(`[!] Server started at http://${Config.HOST}:${Config.PORT}${Config.MAIN_PATH} v${version}`);
});
