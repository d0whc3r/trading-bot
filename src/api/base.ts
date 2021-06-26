import type { Order } from 'binance-api-node';
import { Config } from '../config';
import type { FutureAction, FuturePosition } from '../types/api';

export abstract class BaseApi {
  protected cleanTicker(name: string) {
    return name.toUpperCase().replace(/PERP$/, '');
  }

  protected abstract setFutureConfig(ticker: string): Promise<void>;

  public abstract getPrices(): Promise<any>;

  public abstract getBalance(): Promise<any>;

  public abstract getPrice(ticker: string): Promise<number | undefined>;

  protected abstract getAmountDecimals(ticker: string): Promise<number>;

  protected abstract getPriceDecimals(ticker: string): Promise<number>;

  protected async genericActions({ ticker, price, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const name = this.cleanTicker(ticker);
    const calc = await this.calculateAmount(name, usdt * Config.BINANCE_LEVERAGE, price);
    if (!calc) {
      return null;
    }
    await this.setFutureConfig(name);
    return { ...calc, name };
  }

  protected async calculateAmount(ticker: string, usdt: number, price?: number) {
    let thePrice = price;
    if (!thePrice) {
      thePrice = await this.getPrice(ticker);
    }
    if (!thePrice) {
      return null;
    }
    const decimals = await this.getAmountDecimals(ticker);
    const amount = Math.floor((usdt / thePrice) * 10 ** decimals) / 10 ** decimals;
    return { amount, price: thePrice };
  }

  public abstract long(action: FutureAction): Promise<null | any>;

  public abstract short(action: FutureAction): Promise<null | any>;

  public abstract close(ticker: string, prev?: FuturePosition): Promise<boolean | null | undefined | Order>;

  protected positiveAmount(amount: number) {
    let result = amount;
    if (result < 0) {
      result *= -1;
    }
    return result;
  }

  protected negativeAmount(amount: number) {
    let result = amount;
    if (result > 0) {
      result *= -1;
    }
    return result;
  }
}
