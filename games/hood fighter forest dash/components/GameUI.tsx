import React from 'react';
import { GameState } from '../types';
import { TOTAL_TIME, COLORS } from '../constants';

interface GameUIProps {
  gameState: GameState;
  score: number;
  time: number;
  onStart: () => void;
  onRestart: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, score, time, onStart, onRestart }) => {
  const formatTime = (seconds: number) => {
    return seconds.toFixed(0);
  };

  const progress = ((TOTAL_TIME - time) / TOTAL_TIME) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 font-['Fredoka_One'] text-white">
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full drop-shadow-md">
        {/* P1 Score Block */}
        <div className="flex flex-col items-start">
          <span className="text-xl tracking-wider text-[#ff1744] drop-shadow-sm">HOOD</span>
          <div className="w-32 h-5 bg-black/50 relative rounded-full overflow-hidden border-2 border-white/20">
             <div className="h-full bg-gradient-to-r from-red-500 to-pink-500 absolute top-0 left-0 transition-all duration-1000" style={{ width: '100%' }}></div>
          </div>
          <span className="mt-1 text-lg">SCORE: {score}</span>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center">
          <div className="text-5xl drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
            {formatTime(time)}
          </div>
        </div>

        {/* P2/Enemy Block */}
        <div className="flex flex-col items-end">
          <span className="text-xl tracking-wider text-[#90a4ae] drop-shadow-sm">WOLF</span>
          <div className="w-32 h-5 bg-black/50 relative rounded-full overflow-hidden border-2 border-white/20">
             <div className="h-full bg-gradient-to-l from-gray-500 to-slate-600 absolute top-0 right-0 transition-all duration-200" style={{ width: `${100 - progress}%` }}></div>
          </div>
          <span className="mt-1 text-lg text-gray-300">DISTANCE</span>
        </div>
      </div>

      {/* Center Screen Messages */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        {gameState === GameState.START && (
          <div className="bg-white/95 p-8 rounded-3xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] text-center transform hover:scale-105 transition-transform duration-300 border-b-8 border-blue-200">
            <h1 className="text-6xl text-[#ff1744] mb-2 drop-shadow-sm">Forest Dash!</h1>
            <p className="text-slate-600 mb-8 text-xl">
              TAP to JUMP • HOLD to SLIDE
            </p>
            <button 
              onClick={onStart}
              className="bg-[#43a047] hover:bg-[#2e7d32] text-white text-3xl py-3 px-10 rounded-full shadow-[0_4px_0_#1b5e20] active:translate-y-1 active:shadow-none transition-all"
            >
              PLAY
            </button>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="bg-white/95 p-8 rounded-3xl shadow-xl text-center border-b-8 border-red-200">
            <h1 className="text-6xl text-slate-800 mb-2">Oh No!</h1>
            <p className="text-[#ff1744] mb-6 text-2xl">The Wolf caught you.</p>
            <div className="text-slate-600 mb-8 text-xl">Final Score: {score}</div>
            <button 
              onClick={onRestart}
              className="bg-[#ffca28] hover:bg-[#ffb300] text-slate-900 text-2xl py-3 px-8 rounded-full shadow-[0_4px_0_#f57f17] active:translate-y-1 active:shadow-none transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {gameState === GameState.VICTORY && (
          <div className="bg-white/95 p-8 rounded-3xl shadow-xl text-center border-b-8 border-green-200">
            <h1 className="text-6xl text-[#43a047] mb-4">You Escaped!</h1>
            <p className="text-slate-600 mb-6 text-xl">Grandma is safe!</p>
            <div className="text-slate-800 mb-8 text-3xl">Total Score: {score + (time * 100)}</div>
            <button 
              onClick={onRestart}
              className="bg-[#29b6f6] hover:bg-[#0288d1] text-white text-2xl py-3 px-8 rounded-full shadow-[0_4px_0_#01579b] active:translate-y-1 active:shadow-none transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls Overlay Hint */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-10 opacity-70 pointer-events-none">
           <div className="flex flex-col items-center">
              <span className="text-white text-xl drop-shadow-md">HOLD ↓</span>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-white text-xl drop-shadow-md">TAP ↥</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;