
import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, CogIcon, DocumentTextIcon, HomeIcon } from '@heroicons/react/24/outline'; // Using Heroicons

interface HeaderProps {
  appName: string;
}

const Header: React.FC<HeaderProps> = ({ appName }) => {
  return (
    <header className="glassmorphism shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <SparklesIcon className="h-8 w-8 text-cyber-cyan" />
          <h1 className="text-2xl font-bold text-gray-100">{appName}</h1>
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-gray-300 hover:text-accent flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-primary/50 transition-colors">
            <HomeIcon className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/history" className="text-gray-300 hover:text-accent flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-primary/50 transition-colors">
            <DocumentTextIcon className="h-5 w-5" />
            <span>Trade History</span>
          </Link>
          <Link to="/settings" className="text-gray-300 hover:text-accent flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-primary/50 transition-colors">
            <CogIcon className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
