import { Config } from '../config';
import type { FutureAction, FuturePosition } from '../types/api';

export abstract class BaseApi {
  protected MAIN_DECIMALS = 10 ** 6;

  protected constructor() {
  }

  protected cleanTicker(name: string) {
    return name.toUpperCase().replace(/PERP$/, '');
  }

  protected abstract setFutureConfig(ticker: string): Promise<void>;

  public abstract getPrices(): Promise<any>;

  public abstract getBalance(): Promise<any>;

  public abstract getPrice(ticker: string): Promise<number | undefined>;

  protected abstract getAmountDecimals(ticker: string): Promise<number>;

  protected async genericActions({ ticker, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const name = this.cleanTicker(ticker);
    const calc = await this.calculateAmount(name, usdt * Config.BINANCE_LEVERAGE);
    if (!calc) {
      return null;
    }
    await this.setFutureConfig(name);
    return { ...calc, name };
  }

  protected async calculateAmount(ticker: string, usdt: number) {
    const price = await this.getPrice(ticker);
    if (!price) {
      return null;
    }
    const decimals = await this.getAmountDecimals(ticker);
    const amount = +((Math.floor(usdt / price * this.MAIN_DECIMALS) / this.MAIN_DECIMALS).toFixed(decimals));
    return { amount, price };
  }

  public abstract long(action: FutureAction): Promise<null | any>;

  public abstract short(action: FutureAction): Promise<null | any>;

  public abstract close(ticker: string, prev?: FuturePosition): Promise<void>;

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
