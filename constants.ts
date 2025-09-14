
import { IndexSymbol, MarketIndex, OptionChain, OptionType, Candle, TechnicalIndicators, Broker, TradeSignal, TradeAction, SignalStatus } from './types';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';

export const INITIAL_NIFTY_DATA: MarketIndex = {
  id: 'nifty50',
  symbol: IndexSymbol.NIFTY50,
  price: 24793.00,
  change: 125.50, // Example change, (New Price - Previous Close)
  pChange: 0.51,   // Example pChange, (change / Previous Close) * 100
  lastUpdated: new Date().toLocaleTimeString(),
};

export const INITIAL_SENSEX_DATA: MarketIndex = {
  id: 'sensex',
  symbol: IndexSymbol.SENSEX,
  price: 81361.00,
  change: 210.30, // Example change
  pChange: 0.26,   // Example pChange
  lastUpdated: new Date().toLocaleTimeString(),
};

export const MOCK_EXPIRY_DATES: string[] = [
  "2024-07-25",
  "2024-08-01",
  "2024-08-08",
  "2024-08-15", // Added one more for variety
];

export const MOCK_NIFTY_OPTION_CHAIN: OptionChain = {
  indexSymbol: IndexSymbol.NIFTY50,
  expiryDate: MOCK_EXPIRY_DATES[0],
  underlyingPrice: 24793.00, // Updated underlying price
  calls: [
    { strike: 24700, type: OptionType.CALL, ltp: 153.25, oi: 125000, iv: 15.5, delta: 0.60, theta: -5.0, oiChange: 12000 },
    { strike: 24800, type: OptionType.CALL, ltp: 92.80, oi: 260000, iv: 14.9, delta: 0.51, theta: -6.2, oiChange: 35000 },
    { strike: 24900, type: OptionType.CALL, ltp: 51.15, oi: 190000, iv: 14.6, delta: 0.39, theta: -7.0, oiChange: 18000 },
  ],
  puts: [
    { strike: 24700, type: OptionType.PUT, ltp: 56.40, oi: 200000, iv: 15.1, delta: -0.40, theta: -5.3, oiChange: -8000 },
    { strike: 24800, type: OptionType.PUT, ltp: 88.60, oi: 230000, iv: 14.8, delta: -0.49, theta: -6.0, oiChange: 7000 },
    { strike: 24900, type: OptionType.PUT, ltp: 132.90, oi: 160000, iv: 15.0, delta: -0.61, theta: -6.7, oiChange: 14000 },
  ]
};

export const MOCK_CANDLE_DATA: Candle[] = [
  // Initial seed data, new candles will be generated based on the last one.
  // Timestamps should be somewhat recent.
  { time: Math.floor(new Date().setHours(9,15,0,0) / 1000) - (5*60*4), open: 24750, high: 24780, low: 24730, close: 24770, volume: 100000 },
  { time: Math.floor(new Date().setHours(9,20,0,0) / 1000) - (5*60*3), open: 24770, high: 24810, low: 24760, close: 24800, volume: 120000 },
  { time: Math.floor(new Date().setHours(9,25,0,0) / 1000) - (5*60*2), open: 24800, high: 24805, low: 24775, close: 24780, volume: 90000 },
  { time: Math.floor(new Date().setHours(9,30,0,0) / 1000) - (5*60*1), open: 24780, high: 24820, low: 24770, close: 24793, volume: 110000 },
  { time: Math.floor(new Date().setHours(9,35,0,0) / 1000), open: 24793, high: 24830, low: 24790, close: 24805, volume: 105000 },
];


export const MOCK_TECHNICAL_INDICATORS: TechnicalIndicators = {
  rsi: 58, // Adjusted example
  macd: { macdLine: 15, signalLine: 18, histogram: -3 }, // Adjusted example
  supertrend: { value: 24650, direction: 'UP' }, // Adjusted example
  ema: { '9': 24780, '20': 24750 },
  sma: { '50': 24500, '200': 24200 },
  pcr: 1.05, // Adjusted example
  indiaVix: 12.8, // Adjusted example
};

export const AVAILABLE_BROKERS: Broker[] = [
    { id: 'zerodha', name: 'Zerodha Kite', logoUrl: 'https://picsum.photos/seed/zerodha/40/40', connected: false },
    { id: 'angelone', name: 'Angel One', logoUrl: 'https://picsum.photos/seed/angelone/40/40', connected: false },
    { id: 'dhan', name: 'Dhan', logoUrl: 'https://picsum.photos/seed/dhan/40/40', connected: false },
];

export const INITIAL_TRADE_SIGNALS: TradeSignal[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    instrument: `NIFTY ${MOCK_EXPIRY_DATES[0]} 24900 CE`, // Updated to new strike
    action: TradeAction.BUY,
    entryPrice: 50,  // Adjusted example price
    targetPrice: 80, // Adjusted example price
    stopLossPrice: 35, // Adjusted example price
    status: SignalStatus.ACTIVE,
    reasoning: "Potential breakout based on current upward momentum and RSI strength approaching overbought."
  }
];