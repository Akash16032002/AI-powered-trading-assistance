import React, { useState } from 'react';
import BrokerConnectPanel from './BrokerConnectPanel.tsx';
import { SunIcon, MoonIcon, BellIcon } from '@heroicons/react/24/outline';

const SettingsView: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Assuming dark mode is default
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Note: Tailwind dark mode config in index.html is 'class'. This is a conceptual toggle.
    // For full effect, ensure your Tailwind setup matches. Current setup relies on body class from index.html.
    // This example primarily changes UI representation, not global theme via Tailwind's mechanism perfectly.
    alert("Dark mode toggle is illustrative. For full Tailwind dark mode, ensure 'dark' class is on <html> or <body> and configure tailwind.config.js appropriately if not using CDN's default behavior.");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      <h2 className="text-3xl font-bold text-gray-100 mb-6">Settings</h2>

      {/* Appearance Settings */}
      <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-accent text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            {isDarkMode ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Notifications</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Enable In-App Alerts</span>
          <label htmlFor="notifications-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                id="notifications-toggle" 
                className="sr-only" 
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)} 
              />
              <div className={`block w-14 h-8 rounded-full transition ${notificationsEnabled ? 'bg-accent' : 'bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${notificationsEnabled ? 'translate-x-6' : ''}`}></div>
            </div>
          </label>
        </div>
        {notificationsEnabled && <p className="text-xs text-gray-400 mt-2">You will receive in-app alerts for new signals and status changes.</p>}
         {!notificationsEnabled && <p className="text-xs text-gray-400 mt-2">In-app alerts are currently disabled.</p>}
      </div>

      {/* Broker Connections */}
      <BrokerConnectPanel />
      
      <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Account</h3>
         <p className="text-gray-400 text-sm">User account management features (e.g., profile, subscription) would be displayed here in a full application.</p>
         <button className="mt-4 bg-accent hover:bg-accent/80 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Manage Subscription (Premium Feature)
        </button>
      </div>

    </div>
  );
};

export default SettingsView;