

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { IndexSymbol, MarketIndex, OptionChain, TechnicalIndicators, TradeSignal, TradeAction, SignalStatus, Candle } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

const API_KEY = process.env.API_KEY;

// The AI instance is created only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  console.warn("API_KEY for Gemini is not set. AI features will not work.");
}

export const fetchRealTimeMarketData = async (
  symbol: IndexSymbol
): Promise<{ price: number; previousClose: number }> => {
  if (!ai) {
    throw new Error("Gemini AI service not initialized. Cannot fetch real-time market data.");
  }

  const prompt = `Using Google Search, what is the current live market price and the previous day's closing price for the ${symbol} index in India?
Respond in the following format, with only numbers after the colon:
PRICE: <price_as_number>
PREVIOUS_CLOSE: <previous_close_as_number>
Do not include any other text or explanations.
For example:
PRICE: 24850.55
PREVIOUS_CLOSE: 24790.10`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, // We want factual data, not creative responses
      },
    });

    const text = response.text.trim();
    console.log(`Raw Gemini Market Data Response for ${symbol}:`, text);

    const priceMatch = text.match(/PRICE:\s*([\d.,]+)/);
    const closeMatch = text.match(/PREVIOUS_CLOSE:\s*([\d.,]+)/);

    if (priceMatch && priceMatch[1] && closeMatch && closeMatch[1]) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        const previousClose = parseFloat(closeMatch[1].replace(/,/g, ''));

        if (!isNaN(price) && !isNaN(previousClose)) {
            return { price, previousClose };
        }
    }

    console.error("Parsed Gemini data is not in the expected format:", text);
    throw new Error("AI response for market data was in an unexpected format.");

  } catch (error) {
    console.error(`Error fetching real-time market data for ${symbol} from Gemini:`, error);
    let errorMessage = `Failed to get real-time market data for ${symbol}.`;
     if (error instanceof Error) {
        if (error.message.includes("429")) {
            errorMessage = `AI service is busy. Could not fetch live price for ${symbol}.`;
        } else {
            errorMessage += ` ${error.message}`;
        }
    }
    throw new Error(errorMessage);
  }
};

const constructPrompt = (
  indexData: MarketIndex,
  optionChain: OptionChain | null,
  indicators: TechnicalIndicators,
  candles: Candle[]
): string => {
  let prompt = `You are an expert options trading signal generator for the Indian stock market, focusing on ${indexData.symbol}.
Your analysis is for educational purposes only and not financial advice.
Carefully analyze the following comprehensive market data to determine the likely market direction and, if a high-probability setup exists, provide a specific option trade recommendation.

**1. Current Market Status (${indexData.symbol})**
- **Live Spot Price:** ${indexData.price.toFixed(2)}
- **Day's Change:** ${indexData.change.toFixed(2)} (${indexData.pChange.toFixed(2)}%)
- **Volatility (India VIX):** ${indicators.indiaVix?.toFixed(2) || 'N/A'} (Higher VIX suggests more volatility and higher option premiums)

**2. Key Technical Indicators**
- **Momentum (RSI 14):** ${indicators.rsi?.toFixed(2) || 'N/A'} (Above 70 is overbought, below 30 is oversold)
- **Trend/Momentum (MACD):** ${indicators.macd ? `Line: ${indicators.macd.macdLine?.toFixed(2)}, Signal: ${indicators.macd.signalLine?.toFixed(2)}, Histogram: ${indicators.macd.histogram?.toFixed(2)}` : 'N/A'} (Positive histogram suggests bullish momentum, negative suggests bearish)
- **Trend (Supertrend):** ${indicators.supertrend ? `${indicators.supertrend.direction} signal at ${indicators.supertrend.value?.toFixed(2)}` : 'N/A'} (Price above value is bullish, below is bearish)
- **Moving Averages:**
  - EMA 9: ${indicators.ema?.['9']?.toFixed(2) || 'N/A'}
  - EMA 20: ${indicators.ema?.['20']?.toFixed(2) || 'N/A'}
  - SMA 50: ${indicators.sma?.['50']?.toFixed(2) || 'N/A'}
  - SMA 200: ${indicators.sma?.['200']?.toFixed(2) || 'N/A'}

**3. Recent Price Action (5-min Candlesticks, most recent last)**
${candles.slice(-5).map(c => `- Time: ${new Date(c.time * 1000).toLocaleTimeString()}, O: ${c.open}, H: ${c.high}, L: ${c.low}, C: ${c.close}`).join('\n')}
(Analyze the candlestick data for patterns like Doji, Hammer, Engulfing, etc., and mention them in your reasoning. These patterns are critical for short-term price direction.)

**4. Options Market Sentiment**
- **Put-Call Ratio (PCR):** ${indicators.pcr?.toFixed(2) || 'N/A'} (Above 1 can be bullish, below 0.7 can be bearish)
`;

  if (optionChain) {
    const maxCallOI = optionChain.calls.reduce((max, call) => call.oi > max.oi ? call : max, { strike: 0, oi: 0 });
    const maxPutOI = optionChain.puts.reduce((max, put) => put.oi > max.oi ? put : max, { strike: 0, oi: 0 });
    prompt += `- **Max Call OI Strike:** ${maxCallOI.strike} (Potential Resistance)
- **Max Put OI Strike:** ${maxPutOI.strike} (Potential Support)
`;
  }
  
  prompt += `
**5. Analysis Guidance**
Synthesize all data points. A bullish signal is stronger if the price is above the Supertrend, the MACD histogram is positive, the RSI is rising (but not overbought), and the price is bouncing off a key moving average or a max Put OI support level. A bearish signal is the opposite. Look for confirmations across different categories of indicators. Give significant weight to recent candlestick patterns as they indicate immediate market psychology.

**6. Your Task:**
Based on a holistic analysis of all the data provided (price action, indicators, and option sentiment):
1.  **Market Direction Prediction:** Conclude with "Bullish", "Bearish", "Sideways", or "Volatile".
2.  **Reasoning:** Provide a concise, step-by-step reasoning. Explain HOW the indicators, candle patterns, and price action support your prediction. For example: "The market is bullish because a bullish engulfing pattern formed on the last candle, the price is trading above the 20 EMA, the MACD histogram is positive, and the PCR is above 1, indicating positive sentiment."
3.  **Trade Signal (Optional):** If, and ONLY if, a high-probability trade setup is identified, recommend a specific option trade.
    -   Action must be 'BUY'.
    -   Instrument name must be precise (e.g., "${indexData.symbol} ${optionChain?.expiryDate || 'YYYY-MM-DD'} 24900 CE").
    -   Provide a clear Entry Price, Target Price, and Stop Loss Price.
4.  **Confidence Score:** If a trade is recommended, provide a confidence score (0-100) based on how many factors align.

If no clear signal exists, state that and explain why (e.g., "No signal due to conflicting indicators (RSI overbought but MACD is bearish) and sideways price action.").
Ensure your response strictly follows the JSON schema.
`;
  return prompt;
};

const tradeSignalSchema = {
    type: Type.OBJECT,
    properties: {
        marketDirectionPrediction: {
            type: Type.STRING,
            description: "The predicted market direction: 'Bullish', 'Bearish', 'Sideways', 'Volatile', or 'Unclear'.",
        },
        reasoning: {
            type: Type.STRING,
            description: "A brief explanation of the trade setup, logic, or reason for no signal.",
        },
        instrument: {
            type: Type.STRING,
            description: "The option instrument, e.g., 'NIFTY 50 2024-07-25 24900 CE'. Only present if a trade is recommended.",
        },
        action: {
            type: Type.STRING,
            description: "'BUY' or 'SELL'. Only present if a trade is recommended.",
            enum: ['BUY', 'SELL'],
        },
        entryPrice: {
            type: Type.NUMBER,
            description: "Estimated entry premium. Only present if a trade is recommended.",
        },
        targetPrice: {
            type: Type.NUMBER,
            description: "Estimated target premium. Only present if a trade is recommended.",
        },
        stopLossPrice: {
            type: Type.NUMBER,
            description: "Estimated stop loss premium. Only present if a trade is recommended.",
        },
        aiConfidence: {
            type: Type.NUMBER,
            description: "Confidence in the trade from 0 to 100. Only present if a trade is recommended.",
        },
    },
    required: ["marketDirectionPrediction", "reasoning"]
};

export const generateAISignal = async (
  indexData: MarketIndex,
  optionChain: OptionChain | null,
  indicators: TechnicalIndicators,
  candles: Candle[]
): Promise<Partial<TradeSignal> & { marketDirectionPrediction?: string } | { reasoning: string; marketDirectionPrediction?: string }> => {
  if (!ai) {
    console.error("Gemini AI service not initialized (API key missing).");
    return { 
        reasoning: "AI service not available (API key missing). No signal generated.",
        marketDirectionPrediction: "Unclear"
    };
  }

  const prompt = constructPrompt(indexData, optionChain, indicators, candles);
  console.log("Gemini Prompt:", prompt);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tradeSignalSchema,
        temperature: 0.3,
      },
    });

    const jsonStr = response.text.trim();
    if (!jsonStr) {
      throw new Error("AI returned an empty response.");
    }
    console.log("Raw Gemini Response:", jsonStr);
    
    let parsedData;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError, "Response was:", jsonStr);
        throw new Error("AI returned a response that was not valid JSON.");
    }

    console.log("Parsed Gemini Data:", parsedData);

    const { 
        marketDirectionPrediction, 
        reasoning, 
        instrument, 
        action, 
        entryPrice, 
        targetPrice, 
        stopLossPrice, 
        aiConfidence 
    } = parsedData;

    // **Improved Validation:** Check for mandatory fields even if the schema is followed.
    if (!marketDirectionPrediction || !reasoning) {
        const missingFields = [
            !marketDirectionPrediction ? 'marketDirectionPrediction' : null,
            !reasoning ? 'reasoning' : null
        ].filter(Boolean).join(', ');
        throw new Error(`AI response is missing required fields: ${missingFields}.`);
    }
    
    const isTradeSignal = instrument && action && 
                          typeof entryPrice === 'number' && 
                          typeof targetPrice === 'number' &&
                          typeof stopLossPrice === 'number';

    if (isTradeSignal) {
      return {
        instrument: instrument,
        action: action.toUpperCase() === "BUY" ? TradeAction.BUY : TradeAction.SELL,
        entryPrice: Number(entryPrice),
        targetPrice: Number(targetPrice),
        stopLossPrice: Number(stopLossPrice),
        reasoning: reasoning,
        aiConfidence: typeof aiConfidence === 'number' ? Number(aiConfidence) : undefined,
        marketDirectionPrediction: marketDirectionPrediction,
        status: SignalStatus.PENDING,
      };
    } else {
      return {
        reasoning: reasoning || "No clear trading signal or unexpected AI response format.",
        marketDirectionPrediction: marketDirectionPrediction || "Unclear",
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    let errorMessage = "An unexpected error occurred while generating the AI signal.";
    if (error instanceof Error) {
        if (error.message.includes("429")) {
            errorMessage = "AI service is currently busy. Please try again in a moment.";
        } else if (error.message.includes("API key not valid")) {
            errorMessage = "AI service configuration error. API key may be invalid.";
        } else if (error.message.includes("not valid JSON")) {
            errorMessage = "Received an invalid response from the AI. Please try again.";
        } else {
            errorMessage = `Failed to get AI signal: ${error.message}`;
        }
    }
    return { 
        reasoning: errorMessage,
        marketDirectionPrediction: "Error" 
    };
  }
};
