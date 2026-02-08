import React, { forwardRef } from 'react';
import { FlowerType } from '../types';

interface BasketProps {
  isHovered: boolean;
  inventory: Record<FlowerType, number>;
  required: Record<FlowerType, number>;
}

const Basket = forwardRef<HTMLDivElement, BasketProps>(({ isHovered, inventory, required }, ref) => {
  // Calculate total progress for visual feedback
  const totalRequired = (Object.values(required) as number[]).reduce((a, b) => a + b, 0);
  const totalCollected = (Object.values(inventory) as number[]).reduce((a, b) => a + b, 0);
  
  // Cap visual fill at 100%
  const fillPercentage = totalRequired > 0 ? Math.min((totalCollected / totalRequired) * 100, 100) : 0;

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-300 transform ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      style={{ width: '160px', height: '140px' }}
    >
      {/* Basket Handle (Back) */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-24 border-8 border-amber-800 rounded-t-full z-0" />

      {/* Basket Body */}
      <div className="absolute bottom-0 w-full h-24 bg-amber-600 rounded-b-3xl rounded-t-lg shadow-xl z-20 flex flex-col items-center justify-center border-b-4 border-amber-800 overflow-hidden">
        {/* Wicker Pattern Texture effect */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
        
        {/* Label */}
        <span className="text-amber-100 font-bold text-lg drop-shadow-md z-30">Basket</span>
        
        {/* Mini progress bar inside basket */}
         <div className="w-24 h-2 bg-amber-900/50 rounded-full mt-2 z-30 overflow-hidden">
           <div 
             className="h-full bg-green-400 transition-all duration-500"
             style={{ width: `${fillPercentage}%` }}
           />
         </div>
      </div>

      {/* Flowers inside visuals (simple stacking effect) */}
      <div className="absolute bottom-16 left-4 right-4 h-8 flex justify-center items-end space-x-1 z-10">
         {inventory[FlowerType.RED_ROSE] > 0 && <div className="w-6 h-6 rounded-full bg-red-500 shadow-sm animate-bounce" style={{ animationDuration: '2s' }} />}
         {inventory[FlowerType.BLUE_VIOLET] > 0 && <div className="w-6 h-6 rounded-full bg-blue-500 shadow-sm animate-bounce" style={{ animationDuration: '2.5s' }} />}
         {inventory[FlowerType.YELLOW_DAISY] > 0 && <div className="w-6 h-6 rounded-full bg-yellow-400 shadow-sm animate-bounce" style={{ animationDuration: '3s' }} />}
      </div>
      
      {/* Drop Zone Glow */}
      {isHovered && (
        <div className="absolute -inset-4 border-4 border-dashed border-yellow-400 rounded-xl animate-pulse z-0 pointer-events-none" />
      )}
    </div>
  );
});

Basket.displayName = 'Basket';

export default Basket;