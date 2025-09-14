

import React, { useState, useEffect, useCallback } from 'react';
import { IndexSymbol, MarketIndex, OptionChain, Candle, TechnicalIndicators, TradeSignal, SignalStatus, OptionData } from '../types';
import { INITIAL_NIFTY_DATA, INITIAL_SENSEX_DATA, MOCK_EXPIRY_DATES, INITIAL_TRADE_SIGNALS } from '../constants';
// import * as mockMarketDataService from '../services/mockMarketDataService'; // Old service
import * as brokerApiService from '../services/brokerApiService'; // New service for "live" data
import * as geminiAIService from '../services/geminiAIService';

import IndexDisplay from './IndexDisplay.tsx';
import CandlestickChart from './CandlestickChart.tsx';
import TechnicalIndicatorsPanel from './TechnicalIndicatorsPanel.tsx';
import OptionChainView from './OptionChainView.tsx';
import TradeSignalDisplay from './TradeSignalDisplay.tsx';
import LoadingIndicator from './LoadingIndicator.tsx';
import AlertMessage from './AlertMessage.tsx';
import { LightBulbIcon } from '@heroicons/react/24/outline';


const Dashboard: React.FC = () => {
  // Initial state for indices can still use constants as a fallback before first "API" call
  const [niftyData, setNiftyData] = useState<MarketIndex>(INITIAL_NIFTY_DATA);
  const [sensexData, setSensexData] = useState<MarketIndex>(INITIAL_SENSEX_DATA);
  const [selectedSymbol, setSelectedSymbol] = useState<IndexSymbol>(IndexSymbol.NIFTY50);
  
  const [candleData, setCandleData] = useState<Candle[]>([]); // Start empty, fetch from "API"
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicators | null>(null); // Start empty
  
  const [availableExpiryDates, setAvailableExpiryDates] = useState<string[]>(MOCK_EXPIRY_DATES);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(MOCK_EXPIRY_DATES[0]);
  const [optionChain, setOptionChain] = useState<OptionChain | null>(null);
  
  const [tradeSignals, setTradeSignals] = useState<TradeSignal[]>(INITIAL_TRADE_SIGNALS);
  const [currentAISignalReasoning, setCurrentAISignalReasoning] = useState<string | null>(null);
  const [marketDirectionPrediction, setMarketDirectionPrediction] = useState<string | null>(null);


  const [isLoadingIndex, setIsLoadingIndex] = useState(true); // True initially
  const [isLoadingCandles, setIsLoadingCandles] = useState(true); // True initially
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(true); // True initially
  const [isLoadingOptionChain, setIsLoadingOptionChain] = useState(true); // True initially
  const [isLoadingAISignal, setIsLoadingAISignal] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // NOTE: In a real application with a broker API:
  // - You'd likely use WebSockets for live price updates (IndexData, and potentially live option LTPs)
  //   instead of polling for everything.
  // - Polling might still be used for candles, option chains (full refresh), and indicators if not WebSocket-driven.
  const fetchDataForSymbol = useCallback(async (symbol: IndexSymbol, expiry: string) => {
    // Set loading states true if not already loading, or for the specific items being fetched.
    // For a poll, we might want to avoid full screen loaders after initial load.
    // Here, we'll set them true to indicate activity.
    setIsLoadingIndex(true);
    setIsLoadingCandles(true);
    setIsLoadingIndicators(true);
    setIsLoadingOptionChain(true);
    
    // Do not clear previous errors before new fetch attempt, so user can see last error until a successful fetch occurs.

    try {
      // These calls now go to brokerApiService, simulating calls to your backend -> broker.
      const indexPromise = brokerApiService.fetchIndexData(symbol);
      const candlesPromise = brokerApiService.fetchCandles(symbol, '5min');
      const indicatorsPromise = brokerApiService.fetchTechnicalIndicators(symbol);
      const optionChainPromise = brokerApiService.fetchOptionChain(symbol, expiry);
      const expiryDatesPromise = brokerApiService.fetchAvailableExpiryDates(symbol);

      const [idxData, candles, indicators, ocData, expiries] = await Promise.all([
        indexPromise, candlesPromise, indicatorsPromise, optionChainPromise, expiryDatesPromise
      ]);

      if (symbol === IndexSymbol.NIFTY50) setNiftyData(idxData);
      else setSensexData(idxData);
      
      setCandleData(candles);
      setTechnicalIndicators(indicators);
      setOptionChain(ocData);
      
      if (expiries && expiries.length > 0) {
        setAvailableExpiryDates(expiries);
        if (!expiries.includes(selectedExpiry)) {
          setSelectedExpiry(expiries[0]); // Reset if current expiry not in new list
        }
      }
      setError(null); // Clear error on successful fetch
    } catch (err) {
      console.error("Failed to fetch market data from broker API (simulated):", err);
      const message = err instanceof Error ? err.message : "Failed to load live market data. Displaying stale data if available, or check connection.";
      setError(message);
    } finally {
      setIsLoadingIndex(false);
      setIsLoadingCandles(false);
      setIsLoadingIndicators(false);
      setIsLoadingOptionChain(false);
    }
  }, [selectedExpiry]); // Removed dependencies that might cause excessive re-renders of this callback

  useEffect(() => {
    // Initial fetch
    fetchDataForSymbol(selectedSymbol, selectedExpiry);
    
    // Polling interval for regular updates.
    // Increased to 30 seconds to be respectful to the Gemini API.
    const intervalId = setInterval(() => {
      fetchDataForSymbol(selectedSymbol, selectedExpiry);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, selectedExpiry]); // fetchDataForSymbol is memoized, so it's safe here

  const handleSelectSymbol = (index: MarketIndex) => {
    if (selectedSymbol !== index.symbol) {
      setSelectedSymbol(index.symbol);
      // Reset dependent data or show loading states immediately
      setCandleData([]);
      setTechnicalIndicators(null);
      setOptionChain(null);
      setIsLoadingCandles(true);
      setIsLoadingIndicators(true);
      setIsLoadingOptionChain(true);
    }
  };

  const handleGenerateAISignal = async () => {
    setIsLoadingAISignal(true);
    setError(null);
    setCurrentAISignalReasoning(null);
    setMarketDirectionPrediction(null);

    const currentMarketData = selectedSymbol === IndexSymbol.NIFTY50 ? niftyData : sensexData;
    if (!currentMarketData || !technicalIndicators || candleData.length === 0) {
      setError("Market data, indicators, or chart data not available to generate signal.");
      setIsLoadingAISignal(false);
      return;
    }

    try {
      const aiResponse = await geminiAIService.generateAISignal(currentMarketData, optionChain, technicalIndicators, candleData);
      
      if (aiResponse.marketDirectionPrediction === "Error" && aiResponse.reasoning) {
        setError(aiResponse.reasoning);
        setCurrentAISignalReasoning(`AI Error: ${aiResponse.reasoning}`);
        setMarketDirectionPrediction("Error");
        return; // Stop processing the response as a valid signal
      }

      setMarketDirectionPrediction(aiResponse.marketDirectionPrediction || "Unclear");

      if ('instrument' in aiResponse && aiResponse.instrument) {
        const newSignal: TradeSignal = {
          id: String(Date.now()),
          timestamp: new Date().toISOString(),
          status: SignalStatus.ACTIVE,
          ...aiResponse
        } as TradeSignal;
        setTradeSignals(prevSignals => [newSignal, ...prevSignals].slice(0, 10));
        setCurrentAISignalReasoning(newSignal.reasoning || "Signal generated.");

      } else if (aiResponse.reasoning) {
        setCurrentAISignalReasoning(aiResponse.reasoning);
      } else {
         setCurrentAISignalReasoning("AI provided an unclear response or no specific trade signal.");
      }

    } catch (err) {
      console.error("AI Signal Generation Error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate AI signal. The AI might be busy or an error occurred.";
      setError(message);
      setCurrentAISignalReasoning("Error during AI signal generation.");
    } finally {
      setIsLoadingAISignal(false);
    }
  };
  
  const handleSelectOption = (option: OptionData, indexSym: IndexSymbol, expiry: string) => {
    console.log("Selected Option:", option, "for", indexSym, "expiry", expiry);
    // Potentially set this option for a trade ticket, etc.
    setError(null); 
  };

  const currentChartTitle = `${selectedSymbol} Candlestick Chart (5 min)`;
  const currentActiveSignal = tradeSignals.find(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.PENDING);

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-6">
      {error && <AlertMessage message={error} type="error" onClose={() => setError(null)} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoadingIndex && !niftyData.price ? <LoadingIndicator /> : <IndexDisplay index={niftyData} isSelected={selectedSymbol === IndexSymbol.NIFTY50} onSelect={handleSelectSymbol} />}
        {isLoadingIndex && !sensexData.price ? <LoadingIndicator /> : <IndexDisplay index={sensexData} isSelected={selectedSymbol === IndexSymbol.SENSEX} onSelect={handleSelectSymbol} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isLoadingCandles && candleData.length === 0 ? <div className="h-[500px] md:h-[600px] flex items-center justify-center glassmorphism rounded-lg shadow-lg"><LoadingIndicator text="Loading Chart..." /></div> : <CandlestickChart data={candleData} title={currentChartTitle} />}
          <div className="glassmorphism rounded-lg"><TechnicalIndicatorsPanel indicators={technicalIndicators} isLoading={isLoadingIndicators && !technicalIndicators} /></div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="glassmorphism p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">AI Trade Signal Generator</h3>
            <p className="text-xs text-gray-500 mb-2">Connects to a simulated broker API for data.</p>
            <button
              onClick={handleGenerateAISignal}
              disabled={isLoadingAISignal || isLoadingIndex || isLoadingIndicators || isLoadingCandles} // Disable if critical data is loading
              className="w-full bg-accent hover:bg-accent/80 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-glow-accent transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              aria-live="polite"
            >
              {isLoadingAISignal ? (
                <LoadingIndicator size="sm" /> 
              ) : (
                <><LightBulbIcon className="h-5 w-5 mr-2" /> Get AI Signal</>
              )}
            </button>
            {marketDirectionPrediction && (
              <p className="text-sm text-gray-300 mt-3">AI Market Prediction: <span className="font-semibold text-cyber-cyan">{marketDirectionPrediction}</span></p>
            )}
            {currentAISignalReasoning && !currentActiveSignal && (
                <p className="text-xs text-gray-400 mt-2 p-2 bg-primary/50 rounded-md">
                    <strong>AI Note:</strong> {currentAISignalReasoning}
                </p>
            )}
          </div>
          
          {currentActiveSignal && (
            <div className="glassmorphism p-1 rounded-lg shadow-lg">
               <h3 className="text-md font-semibold text-gray-100 mb-2 p-3">Latest AI Signal</h3>
              <TradeSignalDisplay signal={currentActiveSignal} />
            </div>
          )}
          
          <div className="glassmorphism p-4 rounded-lg shadow-lg">
             <h3 className="text-lg font-semibold text-gray-100 mb-3">Active Trade Signals ({tradeSignals.filter(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.PENDING).length})</h3>
            {tradeSignals.filter(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.PENDING).length > 0 ? (
                 tradeSignals.filter(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.PENDING).slice(0,3).map(signal => (
                    <TradeSignalDisplay key={signal.id} signal={signal} />
                ))
            ) : (
                <p className="text-gray-400 text-sm">No active AI signals at the moment. Generate one or check history.</p>
            )}
            {tradeSignals.filter(s => s.status === SignalStatus.ACTIVE || s.status === SignalStatus.PENDING).length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-2">More signals in Trade History.</p>
            )}
          </div>
        </div>
      </div>

      <div className="glassmorphism p-4 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Option Chain ({selectedSymbol})</h2>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <label htmlFor="expiry-select" className="text-sm text-gray-300">Expiry:</label>
            <select
              id="expiry-select"
              value={selectedExpiry}
              onChange={(e) => {
                setSelectedExpiry(e.target.value);
                setIsLoadingOptionChain(true); // Indicate loading for new expiry
                setOptionChain(null); // Clear old chain
              }}
              className="bg-primary border border-tertiary text-gray-200 text-sm rounded-lg focus:ring-accent focus:border-accent p-2"
              disabled={isLoadingOptionChain && !optionChain} // Disable while any OC operation is ongoing
            >
              {availableExpiryDates.map(date => (
                <option key={date} value={date}>{new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</option>
              ))}
            </select>
          </div>
        </div>
        <OptionChainView optionChain={optionChain} isLoading={isLoadingOptionChain && !optionChain} onSelectOption={handleSelectOption} />
      </div>
       <p className="text-center text-xs text-gray-500 mt-4">
        Live index prices are fetched using the Gemini API and may be subject to a short delay. Other market data is simulated. In a live app, all data would come from a broker API via a secure backend.
      </p>
    </div>
  );
};

export default Dashboard;
