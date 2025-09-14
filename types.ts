
export enum IndexSymbol {
  NIFTY50 = 'NIFTY 50',
  SENSEX = 'SENSEX',
}

export enum OptionType {
  CALL = 'CE',
  PUT = 'PE',
}

export interface MarketIndex {
  id: string;
  symbol: IndexSymbol;
  price: number;
  change: number;
  pChange: number;
  lastUpdated: string;
}

export interface OptionData {
  strike: number;
  type: OptionType;
  ltp: number;
  oi: number;
  iv: number;
  delta: number;
  theta: number;
  oiChange: number;
}

export interface OptionChain {
  indexSymbol: IndexSymbol;
  expiryDate: string;
  underlyingPrice: number;
  calls: OptionData[];
  puts: OptionData[];
}

export enum TradeAction {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum SignalStatus {
  ACTIVE = 'ACTIVE',
  TARGET_HIT = 'TARGET HIT',
  SL_HIT = 'SL HIT',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING',
}

export interface TradeSignal {
  id: string;
  timestamp: string;
  instrument: string; // e.g., "NIFTY 2024-07-25 24600 CE"
  action: TradeAction;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  status: SignalStatus;
  reasoning?: string;
  aiConfidence?: number; // Optional
}

export interface Candle {
  time: number; // Unix timestamp (seconds or milliseconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: {
    macdLine?: number;
    signalLine?: number;
    histogram?: number;
  };
  supertrend?: {
    value?: number;
    direction?: 'UP' | 'DOWN';
  };
  ema?: { [period: string]: number }; // e.g., ema: { '9': 123, '20': 120 }
  sma?: { [period: string]: number };
  pcr?: number; // Put-Call Ratio
  indiaVix?: number;
}

export interface Broker {
  id: string;
  name: string;
  logoUrl: string;
  connected: boolean;
}