
import React from 'react';
import { ResponsiveContainer, ComposedChart, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell } from 'recharts';
import { Candle } from '../types';

interface CandlestickChartProps {
  data: Candle[];
  title?: string;
}

const CustomTooltipContent: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Because of the two charts, payload can have entries for price and volume
    const dataPoint = payload[0].payload;
    return (
      <div className="glassmorphism p-3 rounded shadow-lg border border-primary text-xs">
        <p className="label text-gray-300">{`Time: ${new Date(dataPoint.time * 1000).toLocaleTimeString()}`}</p>
        <p className="text-gray-400">{`Date: ${new Date(dataPoint.time * 1000).toLocaleDateString()}`}</p>
        <p className="text-gray-400">
          Open: <span className="font-semibold text-gray-200">{dataPoint.open?.toFixed(2)}</span>
        </p>
        <p className="text-gray-400">
          High: <span className="font-semibold text-gray-200">{dataPoint.high?.toFixed(2)}</span>
        </p>
        <p className="text-gray-400">
          Low: <span className="font-semibold text-gray-200">{dataPoint.low?.toFixed(2)}</span>
        </p>
        <p className="text-gray-400">
          Close: <span className="font-semibold text-gray-200">{dataPoint.close?.toFixed(2)}</span>
        </p>
        {dataPoint.volume && (
          <p className="text-gray-400">
            Volume: <span className="font-semibold text-gray-200">{dataPoint.volume.toLocaleString()}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom shape for rendering a proper candlestick
const CandleShape: React.FC<any> = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const { open, close, high, low } = payload;

  // Validate data to prevent rendering errors
  if ([open, close, high, low].some(v => v === undefined || v === null)) {
    return null;
  }

  const range = high - low;
  // Handle doji candles where all prices are the same
  if (range === 0 && open === close) {
     return <line x1={x} y1={y} x2={x + width} y2={y} stroke={fill} strokeWidth={1} />;
  }
  
  // Calculate pixel coordinates from price values
  const pixelsPerPoint = range > 0 ? height / range : 0;
  
  const yOpen = y + (high - open) * pixelsPerPoint;
  const yClose = y + (high - close) * pixelsPerPoint;

  const bodyY = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(1, Math.abs(yOpen - yClose)); // Ensure body is at least 1px for visibility

  return (
    <g>
      {/* Wick: A single line from high to low */}
      <line
        x1={x + width / 2} y1={y}
        x2={x + width / 2} y2={y + height}
        stroke={fill} strokeWidth={1}
      />
      {/* Body: A rectangle from open to close */}
      <rect
        x={x} y={bodyY}
        width={width} height={bodyHeight}
        fill={fill}
      />
    </g>
  );
};


const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-4 text-gray-400 glassmorphism rounded-lg shadow-lg h-[500px] md:h-[600px] flex items-center justify-center">
        No chart data available.
      </div>
    );
  }

  const chartData = data.map(candle => ({
    ...candle,
    wick: [candle.low, candle.high],
    color: candle.close >= candle.open ? '#39FF14' : '#FF3131', // positive, negative from new theme
  }));

  const yDomain = [
    Math.min(...data.map(d => d.low)) * 0.99,
    Math.max(...data.map(d => d.high)) * 1.01
  ];

  const volumeDomain = [
    0,
    Math.max(...data.map(d => d.volume || 0)) * 2 // Give some headroom for volume bars
  ];

  return (
    <div className="glassmorphism p-2 sm:p-4 rounded-lg shadow-lg h-[500px] md:h-[600px] flex flex-col">
      {title && <h3 className="text-lg font-semibold text-gray-100 mb-4 px-2">{title}</h3>}
      
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="75%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            syncId="tradeChart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(138, 43, 226, 0.2)" vertical={false} />
            <XAxis dataKey="time" hide={true} />
            <YAxis
              orientation="left"
              domain={yDomain}
              stroke="#9CA3AF"
              tickFormatter={(value) => value.toFixed(0)}
              tick={{ fontSize: 10 }}
              allowDataOverflow={true}
            />
            <Tooltip
              content={<CustomTooltipContent />}
              cursor={{ stroke: '#00d9ff', strokeWidth: 1, strokeDasharray: '3 3' }}
              position={{ y: 20 }}
            />
            <Bar dataKey="wick" barSize={8} shape={<CandleShape />}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height="25%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            syncId="tradeChart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(138, 43, 226, 0.2)" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              domain={volumeDomain}
              stroke="#9CA3AF"
              tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'}
              tick={{ fontSize: 10 }}
              width={40}
            />
             <Tooltip
              content={<CustomTooltipContent />}
              cursor={{ stroke: '#00d9ff', strokeWidth: 1, strokeDasharray: '3 3' }}
             />
            <Bar dataKey="volume" yAxisId="volume" barSize={8}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-vol-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CandlestickChart;
