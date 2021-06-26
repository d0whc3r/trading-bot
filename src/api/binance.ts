import BinanceApi, { Binance as BinanceType, ExchangeInfo, MarginType, NewOrder, Order, OrderSide, OrderType } from 'binance-api-node';
import { Config } from '../config';
import { logger } from '../logger';
import type { FutureAction, FuturePosition, LimitOrderParams } from '../types/api';
import { BaseApi } from './base';

export class Binance extends BaseApi {
  private static _instance: Binance;
  private exchange: BinanceType;
  private recvWindow = 10000000;
  private exchangeInfo: ExchangeInfo | undefined;

  private constructor() {
    super();
    this.exchange = BinanceApi({
      apiKey: Config.BINANCE_APIKEY,
      apiSecret: Config.BINANCE_SECRETKEY
    });
    void this.exchange.futuresPositionMode({ dualSidePosition: true } as any);
    void this.getExchangeInfo();
  }

  static get instance() {
    if (this._instance) {
      return this._instance;
    }
    return new Binance();
  }

  private async getExchangeInfo() {
    if (!this.exchangeInfo) {
      this.exchangeInfo = await this.exchange.futuresExchangeInfo();
    }
    return this.exchangeInfo;
  }

  protected async setFutureConfig(ticker: string) {
    try {
      const result = await this.exchange.futuresLeverage({ symbol: ticker, leverage: Config.BINANCE_LEVERAGE });
      logger.debug({ title: '[+] Leverage changed', ticker, leverage: Config.BINANCE_LEVERAGE, result });
    } catch (e) {
      logger.error('[!] Error changing leverage', e);
    }
    try {
      const result = await this.exchange.futuresMarginType({ symbol: ticker, marginType: Config.BINANCE_MARGIN_TYPE as MarginType });
      logger.debug({ title: '[+] Margin type changed', ticker, margin: Config.BINANCE_MARGIN_TYPE, result });
    } catch {
      // console.error('[!] Error changing margin', e);
    }
  }

  public async getPrices() {
    return await this.exchange.futuresPrices();
  }

  public async getPrice(ticker: string) {
    const prices = await this.getPrices();
    const price = prices[ticker.toString()];
    if (!price || !Object.prototype.hasOwnProperty.call(prices, ticker)) {
      return undefined;
    }
    return +price;
  }

  public async getBalance() {
    return await this.exchange.futuresAccountBalance();
  }

  private async getDecimals(ticker: string, filter: string) {
    const symbol = this.cleanTicker(ticker);
    const info = (await this.getExchangeInfo()).symbols.find((s) => s.symbol === symbol);
    let decimals = 0;
    if (info) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      decimals = info[filter.toString()];
      // const pFilter: any = info.filters.find((f) => f.filterType === filter);
      // if (pFilter) {
      //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      //   decimals = pFilter[part.toString()].split('1')[0]?.split('.')[1]?.length || 0;
      // }
    }
    return decimals;
  }

  protected async getAmountDecimals(ticker: string) {
    // return await this.getDecimals(ticker, 'LOT_SIZE', 'stepSize');
    return await this.getDecimals(ticker, 'quantityPrecision');
  }

  protected async getPriceDecimals(ticker: string) {
    // return await this.getDecimals(ticker, 'PRICE_FILTER', 'tickSize');
    return await this.getDecimals(ticker, 'pricePrecision');
  }

  private async calculateLimit({ ticker, position, entryPrice, type }: LimitOrderParams) {
    if ((type === 'stop' && !Config.BINANCE_STOP_LOSS) || (type === 'profit' && !Config.BINANCE_TAKE_PROFIT)) {
      return null;
    }
    let realPrice = entryPrice;
    if (!realPrice) {
      realPrice = await this.getPrice(ticker);
    }
    if (!realPrice) {
      return null;
    }
    const isStop = type === 'stop';
    const calc = isStop ? Config.BINANCE_STOP_LOSS : Config.BINANCE_TAKE_PROFIT;
    const diff = (realPrice * calc) / Config.BINANCE_LEVERAGE / 100;
    const priceDecimals = await this.getPriceDecimals(ticker);
    const prices = [realPrice - diff, realPrice + diff].map((p) => Math.floor(p * 10 ** priceDecimals) / 10 ** priceDecimals);
    const first = isStop ? 0 : 1;
    const second = isStop ? 1 : 0;
    const result = position === 'long' ? prices[+first] : prices[+second];
    return result.toString();
  }

  protected async setLimitOrder(params: LimitOrderParams) {
    const { ticker, position, type, entryPrice } = params;
    const symbol = this.cleanTicker(ticker);
    const limitPrice = await this.calculateLimit(params);
    const positionSide = position.toUpperCase();
    const side = position === 'long' ? OrderSide.SELL : OrderSide.BUY;
    const orderType = type === 'stop' ? OrderType.STOP_MARKET : OrderType.TAKE_PROFIT_MARKET;
    if (limitPrice) {
      logger.debug({ title: `${symbol} Add limit order for ${type} at ${limitPrice} based on entry price: ${entryPrice || 'Market'}` });
      await this.exchange.futuresOrder({
        symbol,
        positionSide,
        recvWindow: this.recvWindow,
        side,
        type: orderType,
        stopPrice: limitPrice,
        closePosition: true
      } as NewOrder);
    }
  }

  public async long({ ticker, price, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const generic = await this.genericActions({ ticker, price, usdt });
    if (!generic) {
      return null;
    }
    const { name, amount, price: itemPrice } = generic;
    logger.info(`[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} LONG[${name}/${itemPrice}]: ${usdt}$ -> ${amount}${price ? ` (${price}$)` : '(Market)'}`);
    if (Config.BINANCE_DEMO) {
      return null;
    }
    let result: Order | undefined;
    try {
      const orderInfo = {
        symbol: name,
        side: OrderSide.BUY,
        type: price ? OrderType.LIMIT : OrderType.MARKET,
        positionSide: 'LONG',
        recvWindow: this.recvWindow
      } as NewOrder;
      const mainOrder = {
        ...orderInfo,
        quantity: amount.toString(),
        isIsolated: true
      };
      if (price) {
        mainOrder.price = price.toString();
      }
      result = await this.exchange.futuresOrder(mainOrder);
      await this.setLimitOrder({ ticker, position: 'long', entryPrice: price || generic.price, type: 'stop' });
      await this.setLimitOrder({ ticker, position: 'long', entryPrice: price || generic.price, type: 'profit' });
      logger.debug({ title: 'LONG RESULT ACTION', result });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      logger.error({ title: 'ERROR in open LONG', msg: error.message, error });
    }
    return result;
  }

  public async short({ ticker, price, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const generic = await this.genericActions({ ticker, price, usdt });
    if (!generic) {
      return null;
    }
    const { name, amount, price: itemPrice } = generic;
    logger.info(`[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} SHORT[${name}/${itemPrice}]: ${usdt}$ -> ${amount}${price ? ` (${price}$)` : '(Market)'}`);
    if (Config.BINANCE_DEMO) {
      return null;
    }
    let result: Order | undefined;
    try {
      const orderInfo = {
        symbol: name,
        side: OrderSide.SELL,
        type: price ? OrderType.LIMIT : OrderType.MARKET,
        positionSide: 'SHORT',
        recvWindow: this.recvWindow
      } as NewOrder;
      const mainOrder = {
        ...orderInfo,
        quantity: amount.toString(),
        isIsolated: true
      };
      if (price) {
        mainOrder.price = price.toString();
      }
      result = await this.exchange.futuresOrder(mainOrder);
      await this.setLimitOrder({ ticker, position: 'short', entryPrice: price || generic.price, type: 'stop' });
      await this.setLimitOrder({ ticker, position: 'short', entryPrice: price || generic.price, type: 'profit' });
      logger.debug({ title: 'SHORT RESULT ACTION', result });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logger.error({ title: 'ERROR in open SHORT', error });
    }
    return result;
  }

  public async closeOpenOrders(ticker: string, prev: FuturePosition) {
    const symbol = this.cleanTicker(ticker);
    const orders = await this.exchange.futuresOpenOrders({ symbol });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    const order = orders.filter((o: any) => o.positionSide && o.positionSide.toLowerCase() === prev.toLowerCase());
    if (order?.length) {
      logger.debug({ title: `Close ${order.length} open order/s`, symbol, position: prev });
      if (Config.BINANCE_DEMO) {
        return true;
      }
      for (let i = 0; i < order.length; i++) {
        const o = order[+i];
        await this.exchange.futuresCancelOrder({ symbol: o.symbol, orderId: o.orderId });
      }
      return true;
    }
    return false;
  }

  protected async getLastAction(ticker: string, prev: FuturePosition) {
    const positions = await this.exchange.futuresPositionRisk();
    const position = positions.find((p) => p.symbol === ticker && +p.positionAmt !== 0 && p.positionSide.toLowerCase() === prev.toLowerCase());
    logger.debug({ title: 'Last actions', ticker, position });
    return position;
  }

  public async close(ticker: string, prev: FuturePosition) {
    const name = this.cleanTicker(ticker);
    const last = await this.getLastAction(name, prev);
    const orders = await this.closeOpenOrders(ticker, prev);
    if (!last) {
      logger.warn(`[!] No last position in ${prev} for ${name}`);
      return orders;
    }
    const { positionAmt, symbol } = last;
    const side = +positionAmt > 0 ? 'BUY' : 'SELL';
    logger.info({
      title: `[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} Closing latest position for ${symbol} - ${side} - ${positionAmt}`
    });
    if (Config.BINANCE_DEMO) {
      return null;
    }
    let order: Order;
    switch (side) {
      case 'BUY': {
        order = await this.exchange.futuresOrder({
          symbol,
          quantity: positionAmt,
          type: OrderType.MARKET,
          side: OrderSide.SELL,
          positionSide: 'LONG',
          recvWindow: this.recvWindow
        } as NewOrder);
        break;
      }
      case 'SELL': {
        const amount = this.positiveAmount(+positionAmt);
        order = await this.exchange.futuresOrder({
          symbol,
          quantity: amount.toString(),
          type: OrderType.MARKET,
          side: OrderSide.BUY,
          positionSide: 'SHORT',
          recvWindow: this.recvWindow
        } as NewOrder);
        break;
      }
      default:
        return;
    }
    logger.info(`[!] Closed position for ${symbol}`);
    logger.debug({ title: 'CLOSED ORDER FOR', symbol, order });
    return order;
  }
}
