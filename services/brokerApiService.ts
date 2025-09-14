
import { IndexSymbol, MarketIndex, OptionChain, Candle, TechnicalIndicators, OptionType, OptionData } from '../types';
import { INITIAL_NIFTY_DATA, INITIAL_SENSEX_DATA, MOCK_EXPIRY_DATES, MOCK_NIFTY_OPTION_CHAIN, MOCK_CANDLE_DATA as INITIAL_MOCK_CANDLE_DATA, MOCK_TECHNICAL_INDICATORS as INITIAL_MOCK_INDICATORS } from '../constants';
import { fetchRealTimeMarketData } from './geminiAIService';

// --- IMPORTANT ---
// This service SIMULATES calls to YOUR backend, which would then interact with a real broker API (e.g., DhanHQ, Angel One).
// - API Key management and actual broker calls MUST happen on a secure backend.
// - For true real-time tick-by-tick data, WebSockets are used, managed by your backend.

const SIMULATE_API_DELAY = 300; // Reduced delay for a snappier feel
const SIMULATE_FAILURE_RATE = 0; // Set to 0 to disable simulated errors for stability

// --- Market Hours Simulation (Local Time as Proxy) ---
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 15;
const MARKET_CLOSE_HOUR = 15;
const MARKET_CLOSE_MINUTE = 30;

const isMarketOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Check if it's a weekday (Mon-Fri)
  if (day === 0 || day === 6) {
    return false;
  }

  // Check if current time is within market hours
  const currentTimeInMinutes = hour * 60 + minute;
  const marketOpenTimeInMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketCloseTimeInMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  return currentTimeInMinutes >= marketOpenTimeInMinutes && currentTimeInMinutes < marketCloseTimeInMinutes;
};


// --- Internal State to Simulate Live Market ---
// These values would be fetched from the live market via your backend in a real app.
let marketState = {
  [IndexSymbol.NIFTY50]: {
    price: INITIAL_NIFTY_DATA.price,
    previousClose: INITIAL_NIFTY_DATA.price - INITIAL_NIFTY_DATA.change, // Approx previous close
    candles: [...INITIAL_MOCK_CANDLE_DATA],
    optionChainStrikes: MOCK_NIFTY_OPTION_CHAIN.calls.map(c => c.strike), // Use initial strikes as base
    lastMarketClosePrice: INITIAL_NIFTY_DATA.price, // Store last price when market was open
  },
  [IndexSymbol.SENSEX]: {
    price: INITIAL_SENSEX_DATA.price,
    previousClose: INITIAL_SENSEX_DATA.price - INITIAL_SENSEX_DATA.change,
    candles: [...INITIAL_MOCK_CANDLE_DATA.map(c => ({ // Adjust Sensex candles for its price scale
        ...c, 
        open: c.open * (INITIAL_SENSEX_DATA.price / INITIAL_NIFTY_DATA.price),
        high: c.high * (INITIAL_SENSEX_DATA.price / INITIAL_NIFTY_DATA.price),
        low: c.low * (INITIAL_SENSEX_DATA.price / INITIAL_NIFTY_DATA.price),
        close: c.close * (INITIAL_SENSEX_DATA.price / INITIAL_NIFTY_DATA.price),
    }))],
    optionChainStrikes: MOCK_NIFTY_OPTION_CHAIN.calls.map(c => c.strike).map(s => Math.round(s * (INITIAL_SENSEX_DATA.price / INITIAL_NIFTY_DATA.price)/100)*100),
    lastMarketClosePrice: INITIAL_SENSEX_DATA.price,
  },
};

const simulateApiCall = <T,>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), SIMULATE_API_DELAY));

// --- Simulated Broker API Functions ---

export const fetchIndexData = async (symbol: IndexSymbol): Promise<MarketIndex> => {
  if (Math.random() < SIMULATE_FAILURE_RATE) {
    throw new Error("Simulated API Error: Index data service is temporarily unavailable.");
  }

  try {
    // Attempt to fetch real data from Gemini
    const realData = await fetchRealTimeMarketData(symbol);
    console.log(`Successfully fetched real market data for ${symbol}:`, realData);

    // Update internal state with real data
    const state = marketState[symbol];
    state.price = realData.price;
    state.previousClose = realData.previousClose;
    state.lastMarketClosePrice = realData.price; // Update last known price

    const change = parseFloat((realData.price - realData.previousClose).toFixed(2));
    const pChange = parseFloat(((change / realData.previousClose) * 100).toFixed(2));

    // The Gemini call already introduces a delay, so resolve promise directly
    return Promise.resolve({
        id: symbol === IndexSymbol.NIFTY50 ? 'nifty50' : 'sensex',
        symbol: symbol,
        price: realData.price,
        change: change,
        pChange: pChange,
        lastUpdated: new Date().toLocaleTimeString(),
    });

  } catch (error) {
    // If Gemini fails (API key missing, error, etc.), gracefully fall back to simulation
    console.warn(`Could not fetch real market data for ${symbol}. Falling back to simulation. Error:`, (error as Error).message);
    
    // Using the simulation logic as a fallback
    const state = marketState[symbol];
    let currentPriceToUse = state.price;

    if (isMarketOpen()) {
      const priceMovementFactor = symbol === IndexSymbol.NIFTY50 ? 0.0003 : 0.00025;
      const priceChange = (Math.random() - 0.5) * (state.price * priceMovementFactor * 20);
      let newPrice = parseFloat((state.price + priceChange).toFixed(2));
      if (newPrice <= 0) newPrice = state.price * 0.99;

      state.price = newPrice; // Update internal state
      state.lastMarketClosePrice = newPrice; // Keep track of last open price
      currentPriceToUse = newPrice;
    } else {
      currentPriceToUse = state.lastMarketClosePrice; // Use the stored last price when market was open
      state.price = currentPriceToUse; // Ensure state.price also reflects this for consistency if other functions access it
    }

    const change = parseFloat((currentPriceToUse - state.previousClose).toFixed(2));
    const pChange = parseFloat(((change / state.previousClose) * 100).toFixed(2));

    // Instead of re-throwing, we return the simulated data so the UI doesn't show an error.
    return simulateApiCall({
      id: symbol === IndexSymbol.NIFTY50 ? 'nifty50' : 'sensex',
      symbol: symbol,
      price: currentPriceToUse,
      change: change,
      pChange: pChange,
      lastUpdated: new Date().toLocaleTimeString(),
    });
  }
};

export const fetchOptionChain = async (symbol: IndexSymbol, expiryDate: string): Promise<OptionChain> => {
  if (Math.random() < SIMULATE_FAILURE_RATE) {
    throw new Error("Simulated API Error: Could not fetch the option chain.");
  }
  const indexState = marketState[symbol];
  // Use the price reflective of market status (live price if open, last close price if closed)
  const underlyingPrice = isMarketOpen() ? indexState.price : indexState.lastMarketClosePrice;

  const centralStrike = Math.round(underlyingPrice / (symbol === IndexSymbol.NIFTY50 ? 50 : 100)) * (symbol === IndexSymbol.NIFTY50 ? 50 : 100);
  const strikes = Array.from({ length: 7 }, (_, i) => centralStrike + (i - 3) * (symbol === IndexSymbol.NIFTY50 ? 100 : 200));

  const marketCurrentlyOpen = isMarketOpen(); // Check once

  const generateOptions = (type: OptionType): OptionData[] => {
    return strikes.map(strike => {
      let ltp;
      if (type === OptionType.CALL) {
        ltp = Math.max(0.1, underlyingPrice - strike + (Math.random() * 20 + 5) * (strike > underlyingPrice ? 0.5: 1) );
      } else { // PUT
        ltp = Math.max(0.1, strike - underlyingPrice + (Math.random() * 20 + 5) * (strike < underlyingPrice ? 0.5: 1));
      }
      
      // Reduce or eliminate LTP fluctuation if market is closed
      const ltpFluctuationFactor = marketCurrentlyOpen ? 0.1 : 0.01; 
      ltp *= (1 + (Math.random() - 0.5) * ltpFluctuationFactor);

      return {
        strike: strike,
        type: type,
        ltp: parseFloat(ltp.toFixed(2)),
        oi: Math.floor(100000 + Math.random() * 150000),
        iv: parseFloat((12 + Math.random() * 5).toFixed(2)),
        delta: parseFloat(((type === OptionType.CALL ? 0.5 : -0.5) + (Math.random()-0.5)*0.2).toFixed(2)),
        theta: parseFloat((- (3 + Math.random() * 4)).toFixed(2)),
        oiChange: marketCurrentlyOpen ? Math.floor((Math.random() - 0.5) * 20000) : 0, // OI Change only if market open
      };
    });
  };

  return simulateApiCall({
    indexSymbol: symbol,
    expiryDate,
    underlyingPrice: parseFloat(underlyingPrice.toFixed(2)),
    calls: generateOptions(OptionType.CALL),
    puts: generateOptions(OptionType.PUT),
  });
};

export const fetchCandles = async (symbol: IndexSymbol, timeframe: string): Promise<Candle[]> => {
  if (Math.random() < SIMULATE_FAILURE_RATE) {
    throw new Error("Simulated API Error: Chart data is currently unavailable.");
  }
  const state = marketState[symbol];
  const candles = state.candles;
  
  if (candles.length === 0) {
      const initialPrice = state.price;
      candles.push({ time: Math.floor(Date.now() / 1000) - 300, open: initialPrice*0.99, high: initialPrice*1.01, low: initialPrice*0.98, close: initialPrice, volume: 100000});
  }

  const lastCandle = candles[candles.length - 1];
  const expectedNewTime = lastCandle.time + (timeframe === '1min' ? 60 : 300); // 5 min default

  // Only add new candle if market is open and enough time has passed for a new candle
  if (isMarketOpen() && Math.floor(Date.now() / 1000) >= expectedNewTime) {
    const newOpen = lastCandle.close;
    // Use the current live price for the close of the forming candle
    const newClose = state.price; 
    
    let newHigh = Math.max(newOpen, newClose) + Math.random() * (newOpen * 0.001);
    let newLow = Math.min(newOpen, newClose) - Math.random() * (newOpen * 0.001);
    newHigh = parseFloat(newHigh.toFixed(2));
    newLow = parseFloat(newLow.toFixed(2));

    const newCandle: Candle = {
      time: expectedNewTime, // Use the expected time for regularity
      open: newOpen,
      high: newHigh,
      low: newLow,
      close: newClose,
      volume: Math.floor(80000 + Math.random() * 50000)
    };
    
    candles.push(newCandle);
    if (candles.length > 50) {
      state.candles = candles.slice(-50);
    }
  } else if (!isMarketOpen() && candles.length > 0) {
      // If market is closed, ensure the last candle's close price reflects the last market price
      const lastFormedCandle = candles[candles.length - 1];
      if (lastFormedCandle.close !== state.lastMarketClosePrice) {
          lastFormedCandle.close = state.lastMarketClosePrice;
          // Adjust high/low if necessary
          lastFormedCandle.high = Math.max(lastFormedCandle.open, lastFormedCandle.close, lastFormedCandle.high);
          lastFormedCandle.low = Math.min(lastFormedCandle.open, lastFormedCandle.close, lastFormedCandle.low);
      }
  }


  return simulateApiCall(state.candles);
};

export const fetchTechnicalIndicators = async (symbol: IndexSymbol): Promise<TechnicalIndicators> => {
  const indexState = marketState[symbol];
  // Use price relevant to market status for indicator calculation basis
  const currentPrice = isMarketOpen() ? indexState.price : indexState.lastMarketClosePrice; 
  const candles = indexState.candles;

  let rsi = 50;
  if (candles.length >= 14) { // Typical RSI period
      let gains = 0;
      let losses = 0;
      for (let i = candles.length - 14; i < candles.length; i++) {
          const change = candles[i].close - (candles[i-1] ? candles[i-1].close : candles[i].open); // Use previous close or open for first in period
          if (change > 0) gains += change;
          else losses += Math.abs(change);
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      if (avgLoss === 0) rsi = 100;
      else if (avgGain === 0) rsi = 0;
      else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
      }
  }
  
  const baseIndicators = INITIAL_MOCK_INDICATORS;
  return simulateApiCall({
    ...baseIndicators,
    rsi: parseFloat(rsi.toFixed(2)),
    macd: { 
      macdLine: parseFloat(((currentPrice - (indexState.previousClose * 0.998)) * 0.1).toFixed(2)),
      signalLine: parseFloat(((currentPrice - (indexState.previousClose * 0.999)) * 0.08).toFixed(2)),
      histogram: parseFloat(((currentPrice - (indexState.previousClose * 0.998)) * 0.1 - ((currentPrice - (indexState.previousClose * 0.999)) * 0.08)).toFixed(2))
    },
    supertrend: {
        value: parseFloat((currentPrice * (isMarketOpen() && Math.random() > 0.5 ? 0.995 : 1.005)).toFixed(2)),
        direction: Math.random() > 0.5 ? 'UP' : 'DOWN', // Supertrend direction might flip based on volatility
    },
    pcr: parseFloat((0.8 + Math.random() * 0.4).toFixed(2)),
    indiaVix: parseFloat((12 + Math.random() * (isMarketOpen() ? 5 : 2)).toFixed(2)), // VIX might be less volatile when market closed
    ema: { 
        '9': parseFloat((currentPrice * (1 - 2/(9+1)) + (candles.length > 0 ? candles[candles.length-1].close * (2/(9+1)) : currentPrice * 0.998) ).toFixed(2)), 
        '20': parseFloat((currentPrice * (1- 2/(20+1)) + (candles.length > 0 ? candles[candles.length-1].close * (2/(20+1)) : currentPrice*0.995) ).toFixed(2)) 
    },
    sma: { 
        '50': candles.length >= 50 ? parseFloat((candles.slice(-50).reduce((sum,c)=> sum+c.close,0)/50).toFixed(2)) : parseFloat((currentPrice * 0.99).toFixed(2)), 
        '200': candles.length >= 200 ? parseFloat((candles.slice(-200).reduce((sum,c)=> sum+c.close,0)/200).toFixed(2)) : parseFloat((currentPrice * 0.98).toFixed(2)) 
    },
  });
};

export const fetchAvailableExpiryDates = async (symbol: IndexSymbol): Promise<string[]> => {
    const today = new Date();
    // Filter out past dates and generate new ones if needed
    let futureDates = MOCK_EXPIRY_DATES.filter(dateStr => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const expiryDate = new Date(year, month - 1, day);
        expiryDate.setHours(23,59,59,999); // Ensure comparison is to end of expiry day
        return expiryDate >= today;
    });

    if (futureDates.length < 4) { // Ensure at least 4 future dates
        const existingDates = new Set(futureDates);
        let lastDate = futureDates.length > 0 ? new Date(futureDates[futureDates.length-1]) : new Date(today);
        // Ensure lastDate is a valid date object if futureDates was empty
        if (isNaN(lastDate.getTime())) lastDate = new Date(today);


        while(futureDates.length < 4) {
            lastDate.setDate(lastDate.getDate() + 1); // Move to next day
             // Find next Thursday
            while(lastDate.getDay() !== 4) { // 4 is Thursday
                 lastDate.setDate(lastDate.getDate() + 1);
            }
            const nextThursdayStr = lastDate.toISOString().split('T')[0];
            if (!existingDates.has(nextThursdayStr)) {
                 futureDates.push(nextThursdayStr);
                 existingDates.add(nextThursdayStr);
            }
             // Ensure we are advancing to find a *new* Thursday if the current one was already added or it's the same day
            if (futureDates.length < 4 && lastDate.getDay() === 4) {
                lastDate.setDate(lastDate.getDate() + 1); // Advance to avoid infinite loop on same Thursday
            }
        }
    }
    futureDates.sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    return simulateApiCall(futureDates.slice(0,4)); // Return up to 4 dates
};
