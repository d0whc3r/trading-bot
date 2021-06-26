export interface Info {
  time: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface Strategy {
  order_action: string;
  order_contracts?: string;
  order_price: string;
  order_id: string;
  market_position: 'short' | 'long' | 'flat';
  market_position_size?: string;
  prev_market_position: string;
  prev_market_position_size?: string;
}

export interface SignalModel {
  code: string;
  time: Date;
  exchange: string;
  ticker: string;
  info?: Info;
  strategy: Strategy;
}

export type ParsedSignalModel = Pick<SignalModel, 'ticker' | 'exchange' | 'strategy'>;
