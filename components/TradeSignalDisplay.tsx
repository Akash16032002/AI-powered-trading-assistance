


import React from 'react';
import { TradeSignal, TradeAction, SignalStatus } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface TradeSignalDisplayProps {
  signal: TradeSignal;
  onAction?: (signalId: string, action: 'CLOSE' | 'MONITOR') => void; // Example actions
}

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, value));
  let barColorClass = 'bg-yellow-500';
  if (normalizedValue >= 75) {
    barColorClass = 'bg-positive';
  } else if (normalizedValue >= 50) {
    barColorClass = 'bg-accent';
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">AI Confidence</p>
      <div className="flex items-center space-x-2">
        <div className="w-full bg-primary/50 rounded-full h-2.5">
          <div
            className={`${barColorClass} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${normalizedValue}%` }}
          ></div>
        </div>
        <span className="text-sm font-semibold text-gray-100 w-12 text-right">{normalizedValue.toFixed(0)}%</span>
      </div>
    </div>
  );
};


const TradeSignalDisplay: React.FC<TradeSignalDisplayProps> = ({ signal, onAction }) => {
  const isBuy = signal.action === TradeAction.BUY;
  const cardBg = isBuy ? 'bg-green-900/20' : 'bg-red-900/20';
  const glowShadow = isBuy ? 'shadow-glow-positive' : 'shadow-glow-negative';
  const borderColor = isBuy ? 'border-positive' : 'border-negative';
  const actionColor = isBuy ? 'text-positive' : 'text-negative';
  const ActionIcon = isBuy ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  const getStatusChip = (status: SignalStatus) => {
    switch (status) {
      case SignalStatus.ACTIVE:
        return <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center"><ClockIcon className="h-3 w-3 mr-1"/>Active</span>;
      case SignalStatus.PENDING:
        return <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full flex items-center"><ClockIcon className="h-3 w-3 mr-1"/>Pending</span>;
      case SignalStatus.TARGET_HIT:
        return <span className="bg-positive text-black text-xs font-semibold px-2 py-0.5 rounded-full flex items-center"><CheckCircleIcon className="h-3 w-3 mr-1"/>Target Hit</span>;
      case SignalStatus.SL_HIT:
        return <span className="bg-negative text-white text-xs px-2 py-0.5 rounded-full flex items-center"><XCircleIcon className="h-3 w-3 mr-1"/>SL Hit</span>;
      case SignalStatus.CLOSED:
        return <span className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center"><InformationCircleIcon className="h-3 w-3 mr-1"/>Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${borderColor} ${cardBg} mb-4 transition-shadow hover:${glowShadow}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className={`text-lg font-bold ${actionColor} flex items-center`}>
            <ActionIcon className="h-5 w-5 mr-2" />
            {signal.action} {signal.instrument}
          </h4>
          <p className="text-xs text-gray-400">Signal Time: {new Date(signal.timestamp).toLocaleString()}</p>
        </div>
        {getStatusChip(signal.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
        <div>
          <p className="text-gray-400">Entry Price</p>
          <p className="font-semibold text-gray-100">₹{signal.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Target Price</p>
          <p className="font-semibold text-positive">₹{signal.targetPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Stop Loss</p>
          <p className="font-semibold text-negative">₹{signal.stopLossPrice.toFixed(2)}</p>
        </div>
      </div>
      
      {signal.aiConfidence != null && (
         <div className="mb-4">
           <ConfidenceBar value={signal.aiConfidence} />
        </div>
      )}

      {signal.reasoning && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 font-semibold">AI Reasoning:</p>
          <p className="text-xs text-gray-300 italic">{signal.reasoning}</p>
        </div>
      )}
      
      {onAction && signal.status === SignalStatus.ACTIVE && (
        <div className="flex space-x-2 mt-4">
          <button 
            onClick={() => onAction(signal.id, 'CLOSE')}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors"
          >
            Close Signal
          </button>
           <button 
            onClick={() => onAction(signal.id, 'MONITOR')}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
          >
            Monitor
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeSignalDisplay;
