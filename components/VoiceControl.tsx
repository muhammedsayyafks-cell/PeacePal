import React from 'react';

interface VoiceControlProps {
  isConnecting: boolean;
  isActive: boolean;
  onToggle: () => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ isConnecting, isActive, onToggle }) => {
  const getButtonClass = () => {
    if (isActive) {
      return 'bg-red-500 hover:bg-red-600';
    }
    if (isConnecting) {
      return 'bg-yellow-500 cursor-not-allowed';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const getIcon = () => {
    if (isActive) {
      return ( // Stop Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
        </svg>
      );
    }
    if (isConnecting) {
      return ( // Connecting/Spinner Icon
        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    return ( // Microphone Icon
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    );
  };

  return (
    <button
      onClick={onToggle}
      disabled={isConnecting}
      className={`p-3 text-white rounded-full font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-200 ${getButtonClass()}`}
      aria-label={isActive ? "Stop voice session" : "Start voice session"}
    >
      {getIcon()}
    </button>
  );
};

export default VoiceControl;
