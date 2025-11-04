
import React from 'react';
import type { CssrsFlow } from '../types';

interface CrisisFlowProps {
  flow: CssrsFlow;
  currentKey: string;
  onResponse: (response: 'yes' | 'no') => void;
}

const CrisisFlow: React.FC<CrisisFlowProps> = ({ flow, currentKey, onResponse }) => {
  const node = flow[currentKey];

  if (!node || node.isEscalation || node.isEnd) {
    return null; // The message is already posted, this UI just waits.
  }

  return (
    <div className="p-4 flex-1 flex flex-col justify-end">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onResponse('yes')}
          className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200"
        >
          Yes
        </button>
        <button
          onClick={() => onResponse('no')}
          className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition duration-200"
        >
          No
        </button>
      </div>
    </div>
  );
};

export default CrisisFlow;
