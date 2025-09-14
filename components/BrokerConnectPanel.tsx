
import React, { useState } from 'react';
import { Broker } from '../types';
import { AVAILABLE_BROKERS } from '../constants';
import { LinkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const BrokerConnectPanel: React.FC = () => {
  const [brokers, setBrokers] = useState<Broker[]>(AVAILABLE_BROKERS);
  const [connectingBrokerId, setConnectingBrokerId] = useState<string | null>(null);

  const handleConnectToggle = (brokerId: string) => {
    setConnectingBrokerId(brokerId);
    // Simulate API call for connection
    setTimeout(() => {
      setBrokers(prevBrokers =>
        prevBrokers.map(b =>
          b.id === brokerId ? { ...b, connected: !b.connected } : b
        )
      );
      setConnectingBrokerId(null);
    }, 1500);
  };

  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-6">Broker Integration</h3>
      <div className="space-y-4">
        {brokers.map(broker => (
          <div key={broker.id} className="bg-primary p-4 rounded-md shadow flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={broker.logoUrl} alt={`${broker.name} logo`} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-medium text-gray-200">{broker.name}</p>
                {broker.connected ? (
                  <span className="text-xs text-positive flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Connected
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" /> Not Connected
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleConnectToggle(broker.id)}
              disabled={connectingBrokerId === broker.id}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center
                ${broker.connected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-accent hover:bg-accent/80 text-white'
                }
                ${connectingBrokerId === broker.id ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <LinkIcon className="h-4 w-4 mr-1.5" />
              {connectingBrokerId === broker.id ? 'Processing...' : (broker.connected ? 'Disconnect' : 'Connect')}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-6">
        Note: Broker integration is simulated. Actual integration requires API credentials and backend handling.
      </p>
    </div>
  );
};

export default BrokerConnectPanel;