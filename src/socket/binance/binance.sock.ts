/* eslint-disable no-console */
import { getListenKey } from '../../api/binance/binance.axios';
import { Config } from '../../config';
import { logger } from '../../logger';
import type { WSOrderTradeUpdate } from '../../types/binanceSock.type';
import SocketClient from './socketClient';

const WSS_BASE_URL = 'wss://fstream.binance.com/';
const HTTP_BASE_URL = 'https://fapi.binance.com/';

export class BinanceSock {
  private static _instance: BinanceSock;
  private socketApi: SocketClient | undefined;

  private constructor() {
    void this.getListenKey().then((listenKey) => {
      this.socketApi = new SocketClient(`ws/${listenKey}`, WSS_BASE_URL);
      this.init();
    });
  }

  static get instance() {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new BinanceSock();
    return this._instance;
  }

  private async getListenKey() {
    // Config.BINANCE_APIKEY, Config.BINANCE_SECRETKEY, HTTP_BASE_URL
    if (Config.BINANCE_APIKEY && Config.BINANCE_SECRETKEY) {
      return await getListenKey(Config.BINANCE_APIKEY, Config.BINANCE_SECRETKEY, HTTP_BASE_URL);
    }
    return '';
  }

  public addHandler<T>(method: string, cb: (param: T) => void) {
    this.socketApi?.setHandler(method, cb);
  }

  public init() {
    this.socketApi?.setHandler('ACCOUNT_UPDATE', (params) => logger.info(params));
    this.socketApi?.setHandler('ORDER_TRADE_UPDATE', (params) => this.handleOrderTradeUpdate(params));
  }

  private handleOrderTradeUpdate(info: WSOrderTradeUpdate) {
    const {
      o: { s: symbol, o: orderType, S: side, ps: positionSide, ap: entryPrice, p: price, X: orderStatus, t: tradeId, i: orderId, rp: profit }
    } = info;

    logger.info({
      symbol,
      orderType,
      side,
      positionSide,
      entryPrice,
      price,
      orderStatus,
      tradeId,
      orderId,
      profit
    });
    logger.info('info', info);
  }
}
