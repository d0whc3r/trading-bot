import Binance from 'node-binance-api';
import { Config } from '../../config';

export class Binance2Sock {
  private static _instance: Binance2Sock;
  private exchange: Binance;

  private constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.exchange = new Binance().options({
      APIKEY: Config.BINANCE_APIKEY,
      APISECRET: Config.BINANCE_SECRETKEY
    });
  }

  static get instance() {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new Binance2Sock();
    return this._instance;
  }

  public listenPrice(symbol: string, cb: (content: any) => void) {
    this.exchange.futuresSubscribe(`${symbol}@markPrice@1s`, (info) => {
      cb(info);
    });
  }
}
