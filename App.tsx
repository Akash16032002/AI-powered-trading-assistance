
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Dashboard from './components/Dashboard.tsx';
import SettingsView from './components/SettingsView.tsx';
import TradeHistoryView from './components/TradeHistoryView.tsx';
import ModalDialog from './components/ModalDialog.tsx';

const APP_NAME = "AI Options Trader";
const DISCLAIMER_ACKNOWLEDGED_KEY = 'disclaimerAcknowledged_v1';

const App: React.FC = () => {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem(DISCLAIMER_ACKNOWLEDGED_KEY);
    if (!acknowledged) {
      setIsDisclaimerOpen(true);
    }
  }, []);

  const handleDisclaimerAcknowledge = () => {
    localStorage.setItem(DISCLAIMER_ACKNOWLEDGED_KEY, 'true');
    setIsDisclaimerOpen(false);
  };

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-secondary text-gray-200">
        <Header appName={APP_NAME} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/history" element={<TradeHistoryView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ModalDialog
          isOpen={isDisclaimerOpen}
          onClose={handleDisclaimerAcknowledge}
          title="Important Disclaimer"
        >
          <div className="text-sm space-y-3 text-gray-300">
            <p>Welcome to {APP_NAME}!</p>
            <p>
              This application and any information, signals, or analysis provided are strictly for <strong>educational and informational purposes only</strong>.
              They do not constitute financial, investment, or trading advice.
            </p>
            <p>
              Trading in options and other financial instruments involves a substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results.
            </p>
            <p>
              We are <strong>not SEBI-registered advisors</strong>. You should consult with a qualified financial advisor before making any trading or investment decisions.
              You are solely responsible for any decisions you make.
            </p>
            <p>By clicking "Acknowledge," you confirm that you have read, understood, and agree to this disclaimer.</p>
            <button
              onClick={handleDisclaimerAcknowledge}
              className="w-full mt-4 bg-accent hover:bg-accent/80 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors"
            >
              Acknowledge & Continue
            </button>
          </div>
        </ModalDialog>
      </div>
    </HashRouter>
  );
};

export default App;
