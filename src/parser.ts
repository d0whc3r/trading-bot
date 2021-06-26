import { Binance } from './api/binance';
import { Config } from './config';
import { logger } from './logger';
import type { FuturePosition } from './types/api';
import type { ParsedSignalModel, Strategy } from './types/signalModel';

function correctPrice(price: string) {
  return +(+price).toFixed(6);
}

// eslint-disable-next-line max-params
function atBinance(ticker: string, action: Strategy['market_position'], price: string, prev?: Strategy['prev_market_position']) {
  const validPrice = correctPrice(price);
  logger.info(`BINANCE: ${action} - ${ticker} - ${validPrice}`);
  switch (action) {
    case 'long':
      void Binance.instance.close(ticker, 'short');
      return Binance.instance.long({ ticker, price: validPrice, usdt: Config.BINANCE_AMOUNT_BET });
    case 'short':
      void Binance.instance.close(ticker, 'long');
      return Binance.instance.short({ ticker, price: validPrice, usdt: Config.BINANCE_AMOUNT_BET });
    case 'flat':
      return Binance.instance.close(ticker, prev as FuturePosition);
  }
}

export function parsePetition({ ticker, exchange, strategy: { market_position, order_price, prev_market_position } }: ParsedSignalModel) {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (exchange) {
    case 'BINANCE':
      return atBinance(ticker, market_position, order_price, prev_market_position);
    default:
  }
  logger.warn({ title: '[!] Error, unknown exchange', exchange, ticker, market_position, order_price });
  return null;
}
