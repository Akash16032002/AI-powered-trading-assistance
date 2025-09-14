
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-center p-4 mt-8 border-t border-primary">
      <p className="text-xs text-gray-400">
        <strong>Disclaimer:</strong> This application is for educational and informational purposes only.
        It does not constitute financial advice. Trading in options involves substantial risk of loss and is not suitable for every investor.
        We are not SEBI-registered advisors. Consult with a qualified financial advisor before making any trading decisions.
      </p>
      <p className="text-xs text-gray-500 mt-1">
        AI Options Trader &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
};

export default Footer;