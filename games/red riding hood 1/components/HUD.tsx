import React from 'react';
import { FlowerType } from '../types';
import { Check, Clock, Trophy } from 'lucide-react';
import { FLOWER_COLORS } from '../constants';

interface HUDProps {
  score: number;
  timeLeft: number;
  inventory: Record<FlowerType, number>;
  required: Record<FlowerType, number>;
  onFinish: () => void;
  canFinish: boolean;
}

const HUD: React.FC<HUDProps> = ({ score, timeLeft, inventory, required, onFinish, canFinish }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-50 flex flex-col md:flex-row justify-between items-start md:items-center">
      
      {/* Top Left: Score & Time */}
      <div className="flex gap-4 mb-4 md:mb-0">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border-2 border-amber-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className={`font-bold text-xl font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border-2 border-amber-100 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-xl text-gray-700">{score}</span>
        </div>
      </div>

      {/* Center/Right: Finish Button */}
      <div className="pointer-events-auto">
        {canFinish && (
          <button
            onClick={onFinish}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-xl transform transition hover:scale-105 animate-bounce flex items-center gap-2 border-4 border-green-200"
          >
            <span>Finish!</span>
            <Check className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Top Right: Objective List */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border-2 border-amber-100 mt-4 md:mt-0">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Required Flowers</h3>
        <div className="flex gap-4">
          {[FlowerType.RED_ROSE, FlowerType.BLUE_VIOLET, FlowerType.YELLOW_DAISY].map((type) => {
            const count = inventory[type] || 0;
            const target = required[type];
            const isComplete = count >= target;
            const colorClass = FLOWER_COLORS[type];

            return (
              <div key={type} className={`flex flex-col items-center ${isComplete ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                   {/* Simple dot representation of flower color */}
                   <div className={`w-4 h-4 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
                </div>
                <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-gray-700'}`}>
                  {Math.min(count, target)}/{target}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HUD;
