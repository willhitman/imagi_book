import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Wand2, Compass, Shield, Users, Search } from 'lucide-react';
import { GameChallenge, GameChoice } from '../types';

interface AdventureGameProps {
  challenge: GameChallenge;
  onComplete: (outcome: string) => void;
}

const AdventureGame: React.FC<AdventureGameProps> = ({ challenge, onComplete }) => {
  const [selectedChoice, setSelectedChoice] = useState<GameChoice | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);

  const icons = {
    CHOICE: <Compass size={48} className="text-kid-purple" />,
    RIDDLE: <Sparkles size={48} className="text-kid-yellow" />,
    FRIEND: <Users size={48} className="text-kid-blue" />,
    TOOL: <Wand2 size={48} className="text-kid-pink" />,
    SEARCH: <Search size={48} className="text-kid-green" />,
  };

  const handleChoice = (choice: GameChoice) => {
    setSelectedChoice(choice);
    setShowOutcome(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 h-full w-full animate-fade-in space-y-8">
      <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 lg:p-16 w-full max-w-4xl border-4 md:border-8 border-kid-yellow relative overflow-hidden">
        
        {/* Background Sparkles */}
        <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
            <Sparkles size={120} className="text-kid-yellow" />
        </div>

        {!showOutcome ? (
          <div className="flex flex-col items-center text-center space-y-10 relative z-10">
            <div className="bg-kid-yellow/10 p-6 rounded-full animate-pulse">
                {icons[challenge.type]}
            </div>
            
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-comic font-bold text-gray-800 leading-tight">
              {challenge.prompt}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {challenge.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  className="bg-white border-4 border-gray-100 hover:border-kid-blue p-6 md:p-10 rounded-3xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-xl md:text-2xl lg:text-3xl font-comic font-bold text-gray-700 hover:text-kid-blue flex items-center justify-center gap-4"
                >
                  <span className="text-kid-blue shrink-0">✨</span>
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-10 relative z-10 py-10">
            <div className="bg-kid-green/20 p-8 rounded-full">
                <Shield size={64} className="text-kid-green animate-bounce" />
            </div>
            
            <div className="space-y-6">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-comic text-gray-500 uppercase tracking-widest font-bold">You Chose: {selectedChoice?.text}</h3>
                <p className="text-2xl md:text-4xl lg:text-5xl font-comic font-bold text-gray-800 leading-relaxed italic">
                "{selectedChoice?.outcome}"
                </p>
            </div>

            <button
              onClick={() => onComplete(selectedChoice!.outcome)}
              className="flex items-center gap-4 px-12 py-6 rounded-full bg-kid-green text-white font-bold text-2xl lg:text-4xl transition-all transform hover:scale-105 shadow-xl hover:shadow-kid-green/40"
            >
              Continue Adventure
              <ArrowRight size={40} />
            </button>
          </div>
        )}
      </div>

      <div className="text-white/80 font-comic font-bold text-xl md:text-2xl bg-black/10 px-6 py-2 rounded-full">
        Challenge: {challenge.type}
      </div>
    </div>
  );
};

export default AdventureGame;