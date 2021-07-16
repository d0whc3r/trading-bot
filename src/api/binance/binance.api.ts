import BinanceApi, {
  Binance as BinanceType,
  ExchangeInfo,
  ExecutionType,
  MarginType,
  NewOrder,
  Order,
  OrderSide,
  OrderStatus,
  OrderType
} from 'binance-api-node';
import { Config } from '../../config';
import { logger } from '../../logger';
import type { ActualOrder, FutureAction, FuturePosition, LimitOrderParams } from '../../types/api.type';
import type { WSPriceUpdate } from '../../types/binanceSock.type';
import { BaseApi } from '../base';
import { Telegram } from '../telegram';

export class Binance extends BaseApi {
  private static _instance: Binance;
  private exchange: BinanceType;
  private recvWindow = 10000000;
  private exchangeInfo: ExchangeInfo | undefined;
  private telegram: Telegram;
  // private stopPercent = +Config.BINANCE_STOP_LOSS;
  // private profitPercent = +Config.BINANCE_TAKE_PROFIT;
  // private binanceSock: Binance2Sock;
  private openSockets = new Map<string, () => void>();
  // private binanceWs: BinanceSock;
  private actualOrders = new Map<string, ActualOrder>();

  private constructor() {
    super();
    this.exchange = BinanceApi({
      apiKey: Config.BINANCE_APIKEY,
      apiSecret: Config.BINANCE_SECRETKEY
    });
    void this.exchange.futuresPositionMode({ dualSidePosition: true } as any);
    void this.getExchangeInfo();
    this.telegram = new Telegram();
    setTimeout(() => {
      void this.initSock();
    }, 2000);
    // this.binanceSock = Binance2Sock.instance;
    // setTimeout(() => {
    //   this.initSockPriceTicker('BTCUSDT');
    // }, 10000);
    // this.binanceWs = BinanceSock.instance;
    // this.initSock();
  }

  static get instance() {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new Binance();
    return this._instance;
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
    }
    return decimals;
  }

  protected async getAmountDecimals(ticker: string) {
    // return await this.getDecimals(ticker, 'LOT_SIZE', 'stepSize');
    return await this.getDecimals(ticker, 'quantityPrecision');
  }

  public async getPriceDecimals(ticker: string) {
    // return await this.getDecimals(ticker, 'PRICE_FILTER', 'tickSize');
    return await this.getDecimals(ticker, 'pricePrecision');
  }

  public async calculateLimit({
    ticker,
    position,
    entryPrice,
    type,
    profit = Config.BINANCE_TAKE_PROFIT,
    stop = Config.BINANCE_STOP_LOSS
  }: LimitOrderParams) {
    if ((type === 'stop' && !Number.isFinite(stop)) || (type === 'profit' && !Number.isFinite(profit))) {
      return null;
    }
    let realPrice = Number(entryPrice) || undefined;
    if (!Number.isFinite(realPrice)) {
      realPrice = await this.getPrice(ticker);
    }
    if (!Number.isFinite(realPrice) || realPrice === undefined) {
      return null;
    }
    const isStop = type === 'stop';
    const calc = isStop ? stop : profit;
    if (!Number.isFinite(calc)) {
      logger.error({ title: `Unknown stop or profit number for ${ticker}`, stop, profit });
      return null;
    }
    const diff = (realPrice * calc) / 100;
    const priceDecimals = await this.getPriceDecimals(ticker);
    const prices = [realPrice - diff, realPrice + diff].map((p) => Math.floor(p * 10 ** priceDecimals) / 10 ** priceDecimals);
    const first = isStop ? 0 : 1;
    const second = isStop ? 1 : 0;
    const result = position.toLowerCase() === 'long' ? prices[+first] : prices[+second];
    return result.toString();
  }

  protected async setLimitOrder(params: LimitOrderParams) {
    const { ticker, position, type, entryPrice, create = true } = params;
    const symbol = this.cleanTicker(ticker);
    const limitPrice = await this.calculateLimit(params);
    logger.debug({ title: 'Calculated limitPrice', limitPrice, params });
    const positionSide = position.toUpperCase();
    const side = position.toLowerCase() === 'long' ? OrderSide.SELL : OrderSide.BUY;
    const orderType = type.toLowerCase() === 'stop' ? OrderType.STOP_MARKET : OrderType.TAKE_PROFIT_MARKET;
    if (create && limitPrice && !Config.BINANCE_DEMO) {
      try {
        logger.info({ title: `${symbol} Add limit order for ${type} at ${limitPrice} based on entry price: ${entryPrice || 'Market'}` });
        await this.exchange.futuresOrder({
          symbol,
          positionSide,
          recvWindow: this.recvWindow,
          side,
          type: orderType,
          stopPrice: limitPrice,
          closePosition: true
        } as NewOrder);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        logger.error({ title: 'Error in limit order', type, position, limitPrice, error });
      }
    } else {
      logger.error({ title: 'Cannot set limit order', create, limitPrice });
    }
    return limitPrice;
  }

  private parsedTicker(ticker: string) {
    const regex = new RegExp('(.*)USDT(?:PERP)?', 'i');
    const ex = regex.exec(ticker);
    return ex ? ex[1] + '/USDT' : '';
  }

  public async long({ ticker, price, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const generic = await this.genericActions({ ticker, price, usdt });
    if (!generic) {
      return null;
    }
    const { name, amount, price: itemPrice } = generic;
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    logger.info(`[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} LONG[${name}/${itemPrice}]: ${usdt}$ -> ${amount}${price ? ` (${price}$)` : '(Market)'}`);
    let result: Order | undefined;
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
    const fractionDigits = await this.getPriceDecimals(ticker);
    const entryPrice = +(price || itemPrice).toFixed(fractionDigits);
    if (price) {
      mainOrder.price = entryPrice.toString();
    }
    try {
      if (!Config.BINANCE_DEMO) {
        result = await this.exchange.futuresOrder(mainOrder);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      logger.error({ title: 'ERROR in open LONG', msg: error.message, error });
    }
    const stopPrice = await this.setLimitOrder({ ticker, position: 'long', entryPrice, type: 'stop', create: !!result });
    const profitPrice = await this.setLimitOrder({ ticker, position: 'long', entryPrice, type: 'profit', create: !!result });
    const profitPrice2 = await this.calculateLimit({
      ticker,
      position: 'long',
      entryPrice,
      type: 'profit',
      profit: Config.BINANCE_TAKE_PROFIT2,
      stop: 0
    });
    this.telegram.sendMessage(
      `Buy ${this.parsedTicker(ticker)}`,
      `Entry Price: ${entryPrice}\n` +
        `Stop Loss: ${stopPrice || ''}\n` +
        `Take Profit: ${profitPrice || ''} - ${profitPrice2 || ''}\n` +
        `Leverage: ${Config.BINANCE_MARGIN_TYPE.toLowerCase()} ${Config.BINANCE_LEVERAGE}`
    );
    logger.debug({ title: 'LONG RESULT ACTION', result });

    await this.closeOpenOrders(ticker, 'short');
    return result;
  }

  public async short({ ticker, price, usdt = Config.BINANCE_AMOUNT_BET }: FutureAction) {
    const generic = await this.genericActions({ ticker, price, usdt });
    if (!generic) {
      return null;
    }
    const { name, amount, price: itemPrice } = generic;
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    logger.info(`[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} SHORT[${name}/${itemPrice}]: ${usdt}$ -> ${amount}${price ? ` (${price}$)` : '(Market)'}`);
    let result: Order | undefined;
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
    const fractionDigits = await this.getPriceDecimals(ticker);
    const entryPrice = +(price || itemPrice).toFixed(fractionDigits);
    if (price) {
      mainOrder.price = entryPrice.toString();
    }
    try {
      if (!Config.BINANCE_DEMO) {
        result = await this.exchange.futuresOrder(mainOrder);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logger.error({ title: 'ERROR in open SHORT', error });
    }
    const stopPrice = await this.setLimitOrder({ ticker, position: 'short', entryPrice, type: 'stop', create: !!result });
    const profitPrice = await this.setLimitOrder({ ticker, position: 'short', entryPrice, type: 'profit', create: !!result });
    const profitPrice2 = await this.calculateLimit({
      ticker,
      position: 'short',
      entryPrice,
      type: 'profit',
      profit: Config.BINANCE_TAKE_PROFIT2,
      stop: 0
    });
    this.telegram.sendMessage(
      `Sell ${this.parsedTicker(ticker)}`,
      `Entry Price: ${entryPrice}\n` +
        `Stop Loss: ${stopPrice || ''}\n` +
        `Take Profit: ${profitPrice || ''} - ${profitPrice2 || ''}\n` +
        `Leverage: ${Config.BINANCE_MARGIN_TYPE.toLowerCase()} ${Config.BINANCE_LEVERAGE}`
    );
    logger.debug({ title: 'SHORT RESULT ACTION', result });
    await this.closeOpenOrders(ticker, 'long');
    return result;
  }

  public async closeOpenOrders(ticker: string, prev: FuturePosition, type?: OrderType) {
    const symbol = this.cleanTicker(ticker);
    const orders = await this.exchange.futuresOpenOrders({ symbol });
    const order = orders.filter(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
      (o: any) => o.positionSide && o.positionSide.toLowerCase() === prev.toLowerCase() && (!type || (type && o.type === type))
    );
    if (order?.length) {
      logger.info({ title: `Close ${order.length} open order/s`, symbol, position: prev, type });
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async close(ticker: string, prev: FuturePosition, isFlat = false) {
    const name = this.cleanTicker(ticker);
    const last = await this.getLastAction(name, prev);
    const orders = await this.closeOpenOrders(ticker, prev);
    if (this.openSockets.has(name)) {
      const closeSocket = this.openSockets.get(name);
      if (closeSocket) {
        closeSocket();
      }
    }
    if (!last) {
      if (isFlat) {
        this.telegram.sendMessage(`Close ${this.parsedTicker(ticker)}`, `BINANCE:${name} (Futures)\n\nPrecio: MARKET`);
      }
      logger.warn(`[!] No last position in ${prev} for ${name}`);
      return orders;
    }
    const { positionAmt, symbol, markPrice, entryPrice } = last;
    const side = +positionAmt > 0 ? 'BUY' : 'SELL';
    logger.info({
      title: `[!]${Config.BINANCE_DEMO ? ' DEMO' : ''} Closing latest position for ${symbol} - ${side} - ${positionAmt}`
    });
    // if (Config.BINANCE_DEMO) {
    //   return null;
    // }
    let order: Order | undefined;
    const profit = this.calculateRoe(+entryPrice, +markPrice, prev);
    switch (side) {
      case 'BUY': {
        if (!Config.BINANCE_DEMO) {
          order = await this.exchange.futuresOrder({
            symbol,
            quantity: positionAmt,
            type: OrderType.MARKET,
            side: OrderSide.SELL,
            positionSide: 'LONG',
            recvWindow: this.recvWindow
          } as NewOrder);
        }
        if (isFlat) {
          this.telegram.sendMessage(
            `Close ${this.parsedTicker(symbol)}`
            // `BINANCE:${symbol} (Futures)\n\nPrecio: MARKET ($${+markPrice})\nProfit: ${profit}%`
          );
        }
        break;
      }
      case 'SELL': {
        if (!Config.BINANCE_DEMO) {
          const amount = this.positiveAmount(+positionAmt);
          order = await this.exchange.futuresOrder({
            symbol,
            quantity: amount.toString(),
            type: OrderType.MARKET,
            side: OrderSide.BUY,
            positionSide: 'SHORT',
            recvWindow: this.recvWindow
          } as NewOrder);
        }
        if (isFlat) {
          this.telegram.sendMessage(
            `Close ${this.parsedTicker(symbol)}`
            // `BINANCE:${symbol} (Futures)\n\nPrecio: MARKET ($${+markPrice})\nProfit: ${profit}%`
          );
        }
        break;
      }
      default:
        return;
    }
    if (Config.BINANCE_DEMO) {
      logger.info(`[!] Closed position for ${symbol} (${profit}%)`);
      logger.debug({ title: 'CLOSED ORDER FOR', symbol, order });
    }
    return order;
  }

  private async initSock() {
    await this.exchange.ws.futuresUser((msg) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { symbol, orderType, executionType, positionSide, orderStatus, price, side, closePosition } = msg;
      if (
        symbol &&
        orderType &&
        executionType &&
        positionSide &&
        [OrderType.LIMIT, OrderType.MARKET].includes(orderType) &&
        executionType === ExecutionType.CANCELED
      ) {
        logger.debug({ title: 'Close and stop trigger', msg });
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        logger.info(`Close remaining open orders of closed order ${symbol}, ${orderType}, ${executionType}, ${positionSide}`);
        void this.closeOpenOrders(symbol, positionSide);
        this.stopSockPriceTicker(symbol);
      } else if (
        symbol &&
        orderType &&
        orderStatus &&
        positionSide &&
        [OrderType.LIMIT, OrderType.MARKET].includes(orderType) &&
        [OrderStatus.FILLED, OrderStatus.PARTIALLY_FILLED].includes(orderStatus) &&
        ((side === OrderSide.BUY && positionSide === 'LONG') || (side === OrderSide.SELL && positionSide === 'SHORT'))
      ) {
        logger.debug({ title: 'Init sock price trigger', msg });
        this.initSockPriceTicker(symbol, price, positionSide);
      } else if (
        (symbol &&
          orderType &&
          (closePosition || [OrderType.STOP_MARKET, OrderType.TAKE_PROFIT_MARKET].includes(orderType)) &&
          [/*OrderStatus.PARTIALLY_FILLED,*/ OrderStatus.FILLED].includes(orderStatus)) ||
        ([OrderStatus.FILLED /*, OrderStatus.PARTIALLY_FILLED*/].includes(orderStatus) &&
          ((side === OrderSide.BUY && positionSide === 'SHORT') || (side === OrderSide.SELL && positionSide === 'LONG')))
      ) {
        logger.debug({ title: 'Stop stock price trigger', msg });
        this.stopSockPriceTicker(symbol);
      } else {
        logger.debug(msg);
      }
    });
  }

  public stopSockPriceTicker(symbol: string) {
    if (this.openSockets.has(symbol)) {
      logger.info(`Close socket ticker for ${symbol}`);
      const sock = this.openSockets.get(symbol);
      if (sock) {
        sock();
      }
      this.openSockets.delete(symbol);
      this.actualOrders.delete(symbol);
    }
  }

  public initSockPriceTicker(symbol: string, entryPrice: number, positionSide: FuturePosition) {
    if (!Config.BINANCE_DYNAMIC_STOP) {
      return;
    }
    if (!this.openSockets.has(symbol)) {
      logger.info('Starting custom substream for ' + symbol);
      this.actualOrders.set(symbol, {
        symbol,
        entryPrice,
        positionSide,
        lastRoe: 0
      });
      const sock = this.exchange.ws.futuresCustomSubStream(`${symbol.toLowerCase()}@markPrice@1s`, (info: WSPriceUpdate) => {
        // logger.info(info);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { s: name, p: markPrice, P: settlePrice, i: indexPrice, E: time } = info;
        void this.calculateDynamicSl(name, { markPrice: +markPrice, settlePrice: +settlePrice, indexPrice: +indexPrice }, time);
      });
      this.openSockets.set(symbol, sock);
    }
  }

  private calculateRoe(entryPrice: number, markPrice: number, positionSide: FuturePosition) {
    const side = positionSide.toUpperCase() === 'LONG' ? 1 : -1;
    return +(((side * (markPrice - entryPrice)) / entryPrice) * 100).toFixed(2);
  }

  private async calculateDynamicSl(symbol: string, priceInfo: { markPrice: number; settlePrice: number; indexPrice: number }, time: number) {
    if (!this.actualOrders.has(symbol) || !this.actualOrders.get(symbol)) {
      return;
    }
    const { markPrice, indexPrice, settlePrice } = priceInfo;
    const { entryPrice, lastRoe, positionSide } = this.actualOrders.get(symbol)!;
    const realStart = +(Config.BINANCE_DYNAMIC_STOP_START / Config.BINANCE_LEVERAGE);
    const realStep = +(Config.BINANCE_DYNAMIC_STOP_STEP / Config.BINANCE_LEVERAGE);
    const actualRoe = this.calculateRoe(entryPrice, markPrice, positionSide);
    const nextRoe = lastRoe + realStep;
    let stopPrice = markPrice;
    let newRoe = 0;
    if (time % 60000 === 0) {
      logger.debug(
        `Calculate ROE for ${symbol} - Actual: ${actualRoe} - Last: ${lastRoe} - Next: ${nextRoe}` +
          ` -- Entry: ${entryPrice} - Position: ${positionSide}` +
          ` -- MarketPrices: ${markPrice} - SettlePrice: ${settlePrice} - IndexPrice: ${indexPrice}`
      );
    }
    if (actualRoe > nextRoe && lastRoe > 0) {
      newRoe = nextRoe;
    } else if (actualRoe > realStart && lastRoe === 0) {
      newRoe = 0.01;
      stopPrice = entryPrice;
    }

    if (newRoe) {
      logger.info(
        `Calculated new ROE for ${symbol} to: ${newRoe}% (Actual: ${actualRoe} - Start: ${realStart} - Last: ${lastRoe} - Next: ${nextRoe})`
      );
      this.actualOrders.set(symbol, { ...this.actualOrders.get(symbol)!, lastRoe: nextRoe });
      await this.closeOpenOrders(symbol, positionSide, OrderType.STOP_MARKET);
      await this.setLimitOrder({ ticker: symbol, type: 'stop', entryPrice: stopPrice, position: positionSide, create: true, stop: +newRoe });
    }
  }
}
