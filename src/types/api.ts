export type FutureAction = {
  ticker: string;
  price?: number;
  usdt?: number;
};

export type FuturePosition = 'long' | 'short';

export type LastAction<A> = {
  [ticker: string]: A;
};

export interface QuoteResult {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
}

export interface ErrorMessage {
  code: number;
  msg: string;
}

export interface GoodPosition {
  orderId: number;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQty: string;
  cumQuote: string;
  timeInForce: string;
  type: string;
  reduceOnly: boolean;
  closePosition: boolean;
  side: string;
  positionSide: 'LONG' | 'SHORT';
  stopPrice: string;
  workingType: string;
  priceProtect: boolean;
  origType: string;
  updateTime: number;
}

export interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string;
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: 'LONG' | 'SHORT';
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

export interface LastPosition {
  position?: Position;
  last?: GoodPosition;
}

export type LimitOrderParams = {
  ticker: string;
  position: FuturePosition;
  entryPrice?: number;
  type: LimitOrderType;
};

export type LimitOrderType = 'stop' | 'profit';
