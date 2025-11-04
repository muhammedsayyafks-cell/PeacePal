
import React from 'react';
import type { ScreenerQuestion } from '../types';
import { screenerOptions } from '../constants';

interface ScreenerProps {
  questions: ScreenerQuestion[];
  currentQuestionIndex: number;
  answers: { [key: string]: number };
  onInitialResponse: (response: 'yes' | 'no') => void;
  onAnswer: (questionId: string, value: number) => void;
}

const Screener: React.FC<ScreenerProps> = ({ questions, currentQuestionIndex, answers, onInitialResponse, onAnswer }) => {
  const currentQuestion = questions[currentQuestionIndex];

  // Initial "yes/no" prompt
  if (Object.keys(answers).length === 0) {
    return (
      <div className="p-4 flex-1 flex flex-col justify-end">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onInitialResponse('yes')}
            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200"
          >
            Yes, I'll try
          </button>
          <button
            onClick={() => onInitialResponse('no')}
            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition duration-200"
          >
            No, thanks
          </button>
        </div>
      </div>
    );
  }

  // Render the actual questions
  return (
    <div className="p-4 flex-1 flex flex-col justify-end">
      <div className="bg-white p-4 rounded-lg shadow-xl mb-4">
        <p className="font-semibold text-gray-800 mb-4">{currentQuestion.text}</p>
        <div className="flex flex-col space-y-3">
          {screenerOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onAnswer(currentQuestion.id, opt.value)}
              className="w-full text-left p-3 bg-gray-100 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Screener;
