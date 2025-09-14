
import React from 'react';
import { OptionChain, OptionData, OptionType, IndexSymbol } from '../types';
import LoadingIndicator from './LoadingIndicator.tsx';

interface OptionChainViewProps {
  optionChain: OptionChain | null;
  isLoading: boolean;
  onSelectOption?: (option: OptionData, indexSymbol: IndexSymbol, expiryDate: string) => void;
}

const OptionRow: React.FC<{ data: OptionData; type: OptionType; onSelect?: () => void; isOtm: boolean; isItm: boolean }> = ({ data, type, onSelect, isOtm, isItm }) => {
  const ltpColor = data.ltp > 0 ? (type === OptionType.CALL ? 'text-positive' : 'text-negative') : 'text-gray-400';
  const rowBg = isItm ? 'bg-tertiary/20' : '';

  return (
    <tr 
        className={`hover:bg-tertiary/40 cursor-pointer text-xs text-center ${rowBg} transition-colors duration-150`}
        onClick={onSelect}
    >
      <td className={`py-2 px-1 border-b border-secondary ${ltpColor} font-semibold`}>{data.ltp?.toFixed(2) || 'N/A'}</td>
      <td className="py-2 px-1 border-b border-secondary text-gray-300">{data.iv?.toFixed(2) || 'N/A'}%</td>
      <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden md:table-cell">{data.oi?.toLocaleString() || 'N/A'}</td>
      <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden md:table-cell">{(data.oiChange > 0 ? '+' : '') + data.oiChange?.toLocaleString() || 'N/A'}</td>
      <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden lg:table-cell">{data.delta?.toFixed(2) || 'N/A'}</td>
      <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden lg:table-cell">{data.theta?.toFixed(2) || 'N/A'}</td>
      {type === OptionType.CALL && <td className="py-2 px-1 border-b border-secondary font-medium bg-secondary/50 text-gray-100">{data.strike}</td>}
    </tr>
  );
};


const OptionChainView: React.FC<OptionChainViewProps> = ({ optionChain, isLoading, onSelectOption }) => {
  if (isLoading) {
    return <div className="p-4 bg-secondary/30 rounded-lg shadow-lg min-h-[300px] flex items-center justify-center"><LoadingIndicator text="Loading Option Chain..." /></div>;
  }

  if (!optionChain) {
    return <div className="p-4 bg-secondary/30 rounded-lg shadow-lg text-gray-400">No option chain data available. Select an index and expiry.</div>;
  }

  const { calls, puts, underlyingPrice, indexSymbol, expiryDate } = optionChain;
  
  const strikes = Array.from(new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])).sort((a, b) => a - b);

  const headerCellStyle = "py-2 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b-2 border-tertiary";

  return (
    <div className="bg-primary/30 p-2 sm:p-4 rounded-lg shadow-lg overflow-x-auto">
      <div className="mb-3 text-center">
        <h3 className="text-lg font-semibold text-gray-100">Option Chain: {indexSymbol} - {expiryDate}</h3>
        <p className="text-sm text-gray-400">Underlying Price: <span className="font-bold text-cyber-cyan">{underlyingPrice.toFixed(2)}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-0.5">
        {/* Calls Table */}
        <div className="overflow-x-auto">
          <h4 className="text-center font-semibold text-positive mb-1">CALLS</h4>
          <table className="min-w-full divide-y divide-secondary">
            <thead className="bg-secondary/50">
              <tr>
                <th className={headerCellStyle}>LTP</th>
                <th className={headerCellStyle}>IV</th>
                <th className={`${headerCellStyle} hidden md:table-cell`}>OI</th>
                <th className={`${headerCellStyle} hidden md:table-cell`}>OI Chg</th>
                <th className={`${headerCellStyle} hidden lg:table-cell`}>Delta</th>
                <th className={`${headerCellStyle} hidden lg:table-cell`}>Theta</th>
                <th className={`${headerCellStyle} bg-secondary/80`}>Strike</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {strikes.map(strike => {
                const call = calls.find(c => c.strike === strike);
                if (!call) return <tr key={`call-empty-${strike}`} className="h-[38px]"><td colSpan={7} className="border-b border-secondary bg-secondary/80 text-center text-xs text-gray-100">{strike}</td></tr>; // Empty row with strike
                const isItm = call.strike < underlyingPrice;
                const isOtm = call.strike > underlyingPrice;
                return <OptionRow key={`call-${strike}`} data={call} type={OptionType.CALL} onSelect={() => onSelectOption && onSelectOption(call, indexSymbol, expiryDate)} isItm={isItm} isOtm={isOtm}/>;
              })}
            </tbody>
          </table>
        </div>

        {/* Puts Table */}
        <div className="overflow-x-auto">
          <h4 className="text-center font-semibold text-negative mb-1">PUTS</h4>
          <table className="min-w-full divide-y divide-secondary">
            <thead className="bg-secondary/50">
              <tr>
                <th className={`${headerCellStyle} bg-secondary/80`}>Strike</th>
                <th className={headerCellStyle}>LTP</th>
                <th className={headerCellStyle}>IV</th>
                <th className={`${headerCellStyle} hidden md:table-cell`}>OI</th>
                <th className={`${headerCellStyle} hidden md:table-cell`}>OI Chg</th>
                <th className={`${headerCellStyle} hidden lg:table-cell`}>Delta</th>
                <th className={`${headerCellStyle} hidden lg:table-cell`}>Theta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {strikes.map(strike => {
                const put = puts.find(p => p.strike === strike);
                 if (!put) return <tr key={`put-empty-${strike}`} className="h-[38px]"><td colSpan={7} className="border-b border-secondary bg-secondary/80 text-center text-xs text-gray-100">{strike}</td></tr>; // Empty row with strike
                const isItm = put.strike > underlyingPrice;
                const isOtm = put.strike < underlyingPrice;
                return (
                  <tr 
                    key={`put-${strike}`} 
                    className={`hover:bg-tertiary/40 cursor-pointer text-xs text-center ${isItm ? 'bg-tertiary/20' : ''} transition-colors duration-150`}
                    onClick={() => onSelectOption && onSelectOption(put, indexSymbol, expiryDate)}
                  >
                    <td className="py-2 px-1 border-b border-secondary font-medium bg-secondary/50 text-gray-100">{put.strike}</td>
                    <td className={`py-2 px-1 border-b border-secondary ${put.ltp > 0 ? 'text-negative' : 'text-gray-400'} font-semibold`}>{put.ltp?.toFixed(2) || 'N/A'}</td>
                    <td className="py-2 px-1 border-b border-secondary text-gray-300">{put.iv?.toFixed(2) || 'N/A'}%</td>
                    <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden md:table-cell">{put.oi?.toLocaleString() || 'N/A'}</td>
                    <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden md:table-cell">{(put.oiChange > 0 ? '+' : '') + put.oiChange?.toLocaleString() || 'N/A'}</td>
                    <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden lg:table-cell">{put.delta?.toFixed(2) || 'N/A'}</td>
                    <td className="py-2 px-1 border-b border-secondary text-gray-300 hidden lg:table-cell">{put.theta?.toFixed(2) || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OptionChainView;
