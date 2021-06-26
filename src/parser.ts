import { Binance } from './api/binance';
import { Config } from './config';
import { logger } from './logger';
import type { FuturePosition } from './types/api';
import type { ParsedSignalModel, Strategy } from './types/signalModel';

function correctPrice(price: string) {
  return +(+price).toFixed(6);
}

function atBinance(ticker: string, action: Strategy['market_position'], price: string, prev?: Strategy['prev_market_position']) {
  const validPrice = correctPrice(price);
  logger.info(`BINANCE: ${action} - ${ticker} - ${validPrice}`);
  switch (action) {
    case 'long':
      Binance.instance.close(ticker, 'short');
      return Binance.instance.long({ ticker, price: validPrice, usdt: Config.BINANCE_AMOUNT_BET });
    case 'short':
      Binance.instance.close(ticker, 'long');
      return Binance.instance.short({ ticker, price: validPrice, usdt: Config.BINANCE_AMOUNT_BET });
    case 'flat':
      return Binance.instance.close(ticker, prev as FuturePosition);
  }
}

export function parsePetition({ ticker, exchange, strategy: { market_position, order_price, prev_market_position } }: ParsedSignalModel) {
  switch (exchange) {
    case 'BINANCE':
      return atBinance(ticker, market_position, order_price, prev_market_position);
    default:
  }
  console.log('[!] Error, unknown exchange', exchange, ticker, market_position, order_price);
  return null;
}
