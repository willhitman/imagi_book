import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import { GameState } from './types';
import { TOTAL_TIME } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(TOTAL_TIME);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
    setGameState(GameState.START);
  };

  return (
    <div className="w-screen h-screen bg-[#2c3e50] flex items-center justify-center overflow-hidden relative">
      
      {/* Game Container - Modern Console Look */}
      <div className="relative w-full max-w-4xl aspect-video bg-black shadow-2xl border-[12px] border-[#34495e] rounded-xl overflow-hidden ring-4 ring-black/20">
        
        <GameCanvas 
          gameState={gameState} 
          setGameState={setGameState}
          gameTime={gameTime}
          setGameTime={setGameTime}
          setScore={setScore}
        />
        
        <GameUI 
          gameState={gameState}
          score={score}
          time={gameTime}
          onStart={handleStart}
          onRestart={handleRestart}
        />
      </div>
      
      <div className="absolute bottom-4 text-white/20 text-sm font-['Fredoka_One'] hidden md:block">
         Hood Fighter: Forest Dash
      </div>
    </div>
  );
};

export default App;