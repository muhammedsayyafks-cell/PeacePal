import React from 'react';

interface ThinkingModeToggleProps {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  isDisabled: boolean;
}

const ThinkingModeToggle: React.FC<ThinkingModeToggleProps> = ({ isEnabled, setIsEnabled, isDisabled }) => {
  const toggleClass = isEnabled ? 'bg-purple-600' : 'bg-gray-300';
  const knobClass = isEnabled ? 'translate-x-5' : 'translate-x-0';
  const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div className={`flex items-center justify-center space-x-2 text-sm ${disabledClass}`}>
      <span className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
        Standard Mode
      </span>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        disabled={isDisabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${toggleClass}`}
        role="switch"
        aria-checked={isEnabled}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${knobClass}`} />
      </button>
      <span className={`font-medium ${isEnabled && !isDisabled ? 'text-purple-700' : isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
        Thinking Mode
      </span>
    </div>
  );
};

export default ThinkingModeToggle;
