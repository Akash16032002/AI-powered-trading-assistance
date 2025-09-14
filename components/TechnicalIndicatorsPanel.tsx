
import React from 'react';
import { TechnicalIndicators } from '../types';
import { ChartBarIcon, PresentationChartLineIcon, VariableIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface TechnicalIndicatorsPanelProps {
  indicators: TechnicalIndicators | null;
  isLoading: boolean;
}

const IndicatorItem: React.FC<{ label: string; value?: string | number; unit?: string; icon?: React.ReactNode }> = ({ label, value, unit, icon }) => (
  <div className="bg-primary p-3 rounded-md shadow flex items-start space-x-3">
    {icon && <div className="text-accent flex-shrink-0">{icon}</div>}
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-100">
        {value !== undefined && value !== null ? `${value}${unit || ''}` : 'N/A'}
      </p>
    </div>
  </div>
);

const TechnicalIndicatorsPanel: React.FC<TechnicalIndicatorsPanelProps> = ({ indicators, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-secondary p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Technical Indicators</h3>
        <p className="text-gray-400">Loading indicators...</p>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="bg-secondary p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">Technical Indicators</h3>
        <p className="text-gray-400">No technical indicators data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Technical Indicators</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <IndicatorItem label="RSI (14)" value={indicators.rsi?.toFixed(2)} icon={<PresentationChartLineIcon className="h-5 w-5"/>} />
        {indicators.macd && (
          <>
            <IndicatorItem label="MACD Line" value={indicators.macd.macdLine?.toFixed(2)} icon={<ChartBarIcon className="h-5 w-5"/>}/>
            <IndicatorItem label="MACD Signal" value={indicators.macd.signalLine?.toFixed(2)} icon={<ChartBarIcon className="h-5 w-5"/>}/>
            <IndicatorItem label="MACD Hist." value={indicators.macd.histogram?.toFixed(2)} icon={<ChartBarIcon className="h-5 w-5"/>}/>
          </>
        )}
        {indicators.supertrend && (
          <IndicatorItem
            label="Supertrend"
            value={`${indicators.supertrend.direction} @ ${indicators.supertrend.value}`}
            icon={<ArrowTrendingUpIcon className="h-5 w-5"/>}
          />
        )}
        <IndicatorItem label="PCR (Overall)" value={indicators.pcr?.toFixed(2)} icon={<VariableIcon className="h-5 w-5"/>}/>
        <IndicatorItem label="India VIX" value={indicators.indiaVix?.toFixed(2)} icon={<VariableIcon className="h-5 w-5"/>}/>

        {indicators.ema && Object.entries(indicators.ema).map(([period, value]) => (
          <IndicatorItem key={`ema-${period}`} label={`EMA ${period}`} value={value.toFixed(2)} icon={<PresentationChartLineIcon className="h-5 w-5"/>}/>
        ))}
        {indicators.sma && Object.entries(indicators.sma).map(([period, value]) => (
          <IndicatorItem key={`sma-${period}`} label={`SMA ${period}`} value={value.toFixed(2)} icon={<PresentationChartLineIcon className="h-5 w-5"/>}/>
        ))}
      </div>
    </div>
  );
};

export default TechnicalIndicatorsPanel;