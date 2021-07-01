import { Binance } from '../binance';

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
  // it('Trailing stop', async () => {
  //   const result = await exchange.trailing({ ticker, usdt: 6 });
  //   expect(result).not.toBeFalsy();
  // });
});
