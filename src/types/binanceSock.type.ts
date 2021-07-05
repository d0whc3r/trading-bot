/* eslint-disable no-shadow */

export const enum WSOrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  TAKE_PROFIT = 'TAKE_PROFIT',
  LIQUIDATION = 'LIQUIDATION'
}

export const enum WSExecutionType {
  NEW = 'NEW',
  CANCELED = 'CANCELED',
  CALCULATED = 'CALCULATED',
  EXPIRED = 'EXPIRED',
  TRADE = 'TRADE'
}

export const enum WSOrderStatus {
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  NEW_INSURANCE = 'NEW_INSURANCE',
  NEW_ADL = 'NEW_ADL'
}

export interface OWSOrderTradeUpdate {
  s: string;
  c: string;
  S: string;
  o: WSOrderType;
  f: string;
  q: string;
  p: string;
  ap: string;
  sp: string;
  x: WSExecutionType;
  X: WSOrderStatus;
  i: number;
  l: string;
  z: string;
  L: string;
  T: number;
  t: number;
  b: string;
  a: string;
  m: boolean;
  R: boolean;
  wt: string;
  ot: string;
  ps: string;
  cp: boolean;
  rp: string;
  pP: boolean;
  si: number;
  ss: number;
}

export interface WSOrderTradeUpdate {
  e: string;
  T: number;
  E: number;
  o: OWSOrderTradeUpdate;
}

export const enum WSEventReason {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  ORDER = 'ORDER',
  FUNDING_FEE = 'FUNDING_FEE',
  WITHDRAW_REJECT = 'WITHDRAW_REJECT',
  ADJUSTMENT = 'ADJUSTMENT',
  INSURANCE_CLEAR = 'INSURANCE_CLEAR',
  ADMIN_DEPOSIT = 'ADMIN_DEPOSIT',
  ADMIN_WITHDRAW = 'ADMIN_WITHDRAW',
  MARGIN_TRANSFER = 'MARGIN_TRANSFER',
  MARGIN_TYPE_CHANGE = 'MARGIN_TYPE_CHANGE',
  ASSET_TRANSFER = 'ASSET_TRANSFER',
  OPTIONS_PREMIUM_FEE = 'OPTIONS_PREMIUM_FEE',
  OPTIONS_SETTLE_PROFIT = 'OPTIONS_SETTLE_PROFIT',
  AUTO_EXCHANGE = 'AUTO_EXCHANGE'
}

export interface BWSAccountUpdate {
  a: string;
  wb: string;
  cw: string;
  bc: string;
}

export interface PWSAccountUpdate {
  s: string;
  pa: string;
  ep: string;
  cr: string;
  up: string;
  mt: string;
  iw: string;
  ps: string;
  ma: string;
}

export interface AWSAccountUpdate {
  B: BWSAccountUpdate[];
  P: PWSAccountUpdate[];
  m: WSEventReason;
}

export interface WSAccountUpdate {
  e: string;
  T: number;
  E: number;
  a: AWSAccountUpdate;
}

export interface WSPriceUpdate {
  e: 'markPriceUpdate';
  E: number;
  s: string;
  p: string;
  P: string;
  i: string;
  r: string;
  T: number;
}
