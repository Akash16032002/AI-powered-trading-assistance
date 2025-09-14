
import React from 'react';
import { MarketIndex } from '../types';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface IndexDisplayProps {
  index: MarketIndex;
  isSelected?: boolean;
  onSelect?: (symbol: MarketIndex) => void;
}

const IndexDisplay: React.FC<IndexDisplayProps> = ({ index, isSelected, onSelect }) => {
  const isPositive = index.change >= 0;
  const changeColor = isPositive ? 'text-positive' : 'text-negative';
  const Icon = isPositive ? ArrowUpIcon : (index.change < 0 ? ArrowDownIcon : MinusIcon);

  return (
    <div 
      className={`bg-secondary p-4 rounded-lg shadow-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-glow-accent hover:-translate-y-1 ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-tertiary hover:ring-accent/70'}`}
      onClick={() => onSelect && onSelect(index)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold text-gray-100">{index.symbol}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${isPositive ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
          Live
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-50 mb-1">{index.price.toFixed(2)}</div>
      <div className={`flex items-center text-sm ${changeColor}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{index.change.toFixed(2)} ({index.pChange.toFixed(2)}%)</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">Last updated: {index.lastUpdated}</p>
    </div>
  );
};

export default IndexDisplay;
