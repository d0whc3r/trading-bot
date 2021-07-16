import { OrderType } from 'binance-api-node';
import { Binance } from '../binance.api';

describe('Binance api', () => {
  let ticker: string;
  let exchange: Binance;
  beforeAll(() => {
    ticker = 'DENTUSDTPERP';
    exchange = Binance.instance;
  });
  it('Open long position with 6$ at market', async () => {
    const result = await exchange.long({ ticker, usdt: 6 });
    expect(result).not.toBeFalsy();
    // setTimeout(() => {
    //   done();
    // }, 100000);
  });
  it('Open long position with 6$ at market COMP', async () => {
    const result = await exchange.long({ ticker: 'COMPUSDT', price: 212.85, usdt: 6 });
    expect(result).not.toBeFalsy();
  });
  it('Close latest position for long', async () => {
    const result = await exchange.close(ticker, 'long');
    expect(result).not.toBeFalsy();
  });
  it('Open short position with 6$ at market', async () => {
    const result = await exchange.short({ ticker, usdt: 6 });
    expect(result).not.toBeFalsy();
  });
  it('Close latest position for short', async () => {
    const result = await exchange.close(ticker, 'short');
    expect(result).not.toBeFalsy();
  });
  it('Close open order for short', async () => {
    const result = await exchange.closeOpenOrders(ticker, 'short');
    expect(result).not.toBeFalsy();
  });
  it('Open and close stop', async () => {
    // const result = await exchange.long({ ticker, usdt: 6 });
    // expect(result).not.toBeFalsy();
    const result = await exchange.closeOpenOrders(ticker, 'long', OrderType.STOP_MARKET);
    expect(result).not.toBeFalsy();
  });
  // it('Futures ws', async (done) => {
  //   exchange.initSockPriceTicker('LINKUSDT');
  //   expect(true).not.toBeFalsy();
  //   setTimeout(() => {
  //     done();
  //   }, 100000);
  // });

  describe('Calculate limit', () => {
    it('Calculate stop for long', async () => {
      exchange.getPriceDecimals = jest.fn().mockResolvedValue(4);
      const limit = await exchange.calculateLimit({ ticker, create: true, position: 'long', type: 'stop', stop: 0.5, entryPrice: 0.3 });
      expect(limit).not.toBeNil().toBe('0.2985');
    });
    it('Calculate stop for short', async () => {
      exchange.getPriceDecimals = jest.fn().mockResolvedValue(4);
      const limit = await exchange.calculateLimit({ ticker, create: true, position: 'short', type: 'stop', stop: 0.5, entryPrice: 0.3 });
      expect(limit).not.toBeNil().toBe('0.3015');
    });
  });
});
