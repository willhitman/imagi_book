import React, { useState } from 'react';
import RaceGame from './components/RaceGame';
import { GameState } from './types';
import { Turtle, Trophy, Timer, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);

  return (
    <div className="w-full h-screen bg-emerald-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }} 
      />

      {gameState === GameState.MENU && (
        <div className="z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl border-4 border-emerald-400 shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500 p-4 rounded-full border-4 border-white shadow-lg">
              <Turtle size={64} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-emerald-300 mb-2 drop-shadow-md tracking-tight">
            TORTOISE<br/>TURBO
          </h1>
          <p className="text-emerald-100 text-lg mb-6 font-medium">
            The Hare is fast, but he gets lazy. <br/>
            Grab <span className="text-yellow-300 font-bold inline-flex items-center gap-1"><Zap size={16} fill="currentColor" /> Peppers</span> to boost!
          </p>
          
          <button 
            onClick={() => setGameState(GameState.RACING)}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all"
          >
            START RACE
          </button>
          
          <div className="mt-6 text-sm text-emerald-300/60 font-mono">
            Tap Left / Right to Steer
          </div>
        </div>
      )}

      {gameState === GameState.RACING && (
        <RaceGame onGameOver={(won) => setGameState(won ? GameState.WON : GameState.LOST)} />
      )}

      {gameState === GameState.WON && (
        <div className="z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl border-4 border-yellow-400 shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
           <div className="flex justify-center mb-6">
            <div className="bg-yellow-500 p-4 rounded-full border-4 border-white shadow-lg animate-bounce">
              <Trophy size={64} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-yellow-300 mb-2 drop-shadow-md">VICTORY!</h1>
          <p className="text-yellow-100 text-lg mb-8">
            Slow and steady? No way.<br/>Fast and boosted won the race!
          </p>
          <button 
            onClick={() => setGameState(GameState.RACING)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(6,95,70)] active:shadow-none active:translate-y-1 transition-all"
          >
            RACE AGAIN
          </button>
        </div>
      )}

      {gameState === GameState.LOST && (
        <div className="z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl border-4 border-red-400 shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
           <div className="flex justify-center mb-6">
            <div className="bg-red-500 p-4 rounded-full border-4 border-white shadow-lg">
              <Timer size={64} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-red-300 mb-2 drop-shadow-md">TOO SLOW!</h1>
          <p className="text-red-100 text-lg mb-8">
            The Hare crossed the line first.<br/>Grab more peppers next time!
          </p>
          <button 
            onClick={() => setGameState(GameState.RACING)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-xl shadow-[0_4px_0_rgb(6,95,70)] active:shadow-none active:translate-y-1 transition-all"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default App;