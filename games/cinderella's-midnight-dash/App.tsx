import React, { useState } from 'react';
import RunnerGame from './components/RunnerGame';
import { GameState } from './types';

const App: React.FC = () => {
  // We keep track of high-level state here if needed, 
  // but most game logic lives in RunnerGame to avoid React render cycle overhead on the canvas loop.

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gray-900 relative overflow-hidden">
      {/* Arcade Cabinet Frame */}
      <div className="relative w-full h-full max-w-4xl max-h-[800px] bg-black border-4 border-gray-700 shadow-2xl rounded-lg overflow-hidden flex flex-col">
        
        {/* Header / Marquee */}
        <div className="h-16 bg-gradient-to-r from-blue-800 to-purple-800 flex items-center justify-center border-b-4 border-yellow-500 z-20">
          <h1 className="text-yellow-400 text-xl md:text-2xl tracking-widest uppercase drop-shadow-md text-center px-4">
            Midnight Dash
          </h1>
        </div>

        {/* Game Screen Area */}
        <div className="flex-1 relative bg-black w-full h-full">
          <RunnerGame />
          
          {/* Scanline Overlay */}
          <div className="scanlines w-full h-full absolute top-0 left-0 pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
};

export default App;