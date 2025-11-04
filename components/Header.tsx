
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white bg-opacity-80 backdrop-blur-md shadow-sm p-4 text-center sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-green-500">
        PeacePal
      </h1>
      <p className="text-sm text-gray-600">A space to feel heard. You are not alone.</p>
    </header>
  );
};

export default Header;
