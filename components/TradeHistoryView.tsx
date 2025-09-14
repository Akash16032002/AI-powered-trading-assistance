import React, { useState, useMemo } from 'react';
import { TradeSignal, SignalStatus } from '../types';
import { INITIAL_TRADE_SIGNALS } from '../constants'; // Using initial signals as mock history
import TradeSignalDisplay from './TradeSignalDisplay.tsx';
import { FunnelIcon, CalendarDaysIcon, MagnifyingGlassIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const TradeHistoryView: React.FC = () => {
  // Simulating more historical data by repeating and modifying initial signals
  const mockHistory: TradeSignal[] = useMemo(() => {
    const baseSignals = INITIAL_TRADE_SIGNALS;
    const history: TradeSignal[] = [];
    const statuses = [SignalStatus.TARGET_HIT, SignalStatus.SL_HIT, SignalStatus.CLOSED, SignalStatus.ACTIVE];
    for (let i = 0; i < 15; i++) {
      const baseSignal = baseSignals[i % baseSignals.length];
      history.push({
        ...baseSignal,
        id: `hist-${i}-${Date.now()}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000 * Math.random()).toISOString(), // Random past dates
        status: statuses[i % statuses.length],
        // Slightly vary prices for realism
        entryPrice: parseFloat((baseSignal.entryPrice * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2)),
        targetPrice: parseFloat((baseSignal.targetPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)),
        stopLossPrice: parseFloat((baseSignal.stopLossPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)),
        reasoning: i % 3 === 0 ? baseSignal.reasoning : "Historical trade based on previous analysis."
      });
    }
    return history.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const [signals, setSignals] = useState<TradeSignal[]>(mockHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<SignalStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const filteredSignals = useMemo(() => {
    return signals
      .filter(signal => {
        if (filterStatus !== 'ALL' && signal.status !== filterStatus) return false;
        if (searchTerm && !signal.instrument.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (dateRange.start && new Date(signal.timestamp) < new Date(dateRange.start)) return false;
        if (dateRange.end && new Date(signal.timestamp) > new Date(new Date(dateRange.end).getTime() + 24*60*60*1000 -1)) return false; // Include full end day
        return true;
      });
  }, [signals, searchTerm, filterStatus, dateRange]);

  // Pagination (simple example)
  const [currentPage, setCurrentPage] = useState(1);
  const signalsPerPage = 5;
  const indexOfLastSignal = currentPage * signalsPerPage;
  const indexOfFirstSignal = indexOfLastSignal - signalsPerPage;
  const currentSignals = filteredSignals.slice(indexOfFirstSignal, indexOfLastSignal);
  const totalPages = Math.ceil(filteredSignals.length / signalsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h2 className="text-3xl font-bold text-gray-100 mb-6">Trade Signal History</h2>

      {/* Filters and Search */}
      <div className="bg-secondary p-4 rounded-lg shadow-lg mb-6 space-y-4 md:space-y-0 md:flex md:items-end md:justify-between">
        <div className="flex-grow md:mr-4">
          <label htmlFor="search-instrument" className="block text-sm font-medium text-gray-300 mb-1">Search Instrument</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search-instrument"
              placeholder="e.g., NIFTY 24500 CE"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary border border-gray-600 text-gray-200 rounded-md p-2 pl-10 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-4 md:space-y-0">
            <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as SignalStatus | 'ALL')}
                className="w-full md:w-auto bg-primary border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-accent focus:border-accent"
                >
                <option value="ALL">All Statuses</option>
                {Object.values(SignalStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="filter-date-start" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                <input type="date" id="filter-date-start" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full md:w-auto bg-primary border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-accent focus:border-accent"/>
            </div>
            <div>
                <label htmlFor="filter-date-end" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <input type="date" id="filter-date-end" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}  className="w-full md:w-auto bg-primary border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-accent focus:border-accent"/>
            </div>
        </div>
      </div>

      {/* Signals List */}
      {currentSignals.length > 0 ? (
        <div className="space-y-4">
          {currentSignals.map(signal => (
            <TradeSignalDisplay key={signal.id} signal={signal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <InformationCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No trade signals match your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="px-3 py-1 bg-primary text-gray-300 rounded-md disabled:opacity-50 hover:bg-accent hover:text-white transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => paginate(pageNumber)}
              className={`px-3 py-1 rounded-md transition-colors ${
                currentPage === pageNumber ? 'bg-accent text-white' : 'bg-primary text-gray-300 hover:bg-accent/80 hover:text-white'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-primary text-gray-300 rounded-md disabled:opacity-50 hover:bg-accent hover:text-white transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeHistoryView;