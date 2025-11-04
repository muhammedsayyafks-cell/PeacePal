import React from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isBotLoading: boolean;
  isAuthReady: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSend, isBotLoading, isAuthReady }) => {
  return (
    <div className="flex-1 flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isBotLoading && handleSend()}
        placeholder="What's on your mind today?"
        className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
        disabled={isBotLoading || !isAuthReady}
        aria-label="Chat input"
      />
      <button
        onClick={handleSend}
        disabled={isBotLoading || !isAuthReady || !input.trim()}
        className="px-5 py-3 bg-purple-500 text-white rounded-full font-semibold shadow-md hover:bg-purple-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition duration-200"
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;