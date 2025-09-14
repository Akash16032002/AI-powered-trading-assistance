
import React from 'react';

interface AlertMessageProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, type, onClose }) => {
  const baseClasses = "p-4 rounded-md shadow-md mb-4 flex justify-between items-center";
  const typeClasses = {
    success: "bg-positive/80 text-white",
    error: "bg-negative/80 text-white",
    warning: "bg-amber-500/80 text-black",
    info: "bg-accent/80 text-white",
  };

  if (!message) return null;

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-xl font-bold hover:text-gray-300"
          aria-label="Close alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;