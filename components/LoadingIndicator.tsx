
import React from 'react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4">
      <div className={`relative flex ${sizeClasses[size]}`}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
        <span className={`relative inline-flex rounded-full h-full w-full bg-cyber-cyan/80`}></span>
      </div>
      {text && <p className="text-gray-300 text-sm mt-2">{text}</p>}
    </div>
  );
};

export default LoadingIndicator;
