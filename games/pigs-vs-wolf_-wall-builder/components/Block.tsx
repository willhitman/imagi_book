import React from 'react';
import { GameBlock, BlockType } from '../types';
import { BLOCK_SIZE, BLOCK_COLORS } from '../constants';

interface BlockProps {
  block: GameBlock;
  onMouseDown: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  isDragging: boolean;
}

const Block: React.FC<BlockProps> = ({ block, onMouseDown, isDragging }) => {
  const { id, type, x, y, rotation, color } = block;

  const shapeClasses = {
    square: 'rounded-md',
    circle: 'rounded-full',
    triangle: 'clip-path-triangle' // We'll handle triangle with SVG or clip-path style inline
  };

  const commonStyle: React.CSSProperties = {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    position: 'absolute',
    left: x,
    top: y,
    transform: `rotate(${rotation}deg) scale(${isDragging ? 1.2 : 1})`,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'transform 0.2s',
    zIndex: isDragging ? 50 : 10,
    touchAction: 'none'
  };

  if (type === 'triangle') {
    // Custom SVG for triangle to make it cleaner than CSS border hacks
    return (
      <div 
        style={commonStyle}
        onMouseDown={(e) => onMouseDown(e, id)}
        onTouchStart={(e) => onMouseDown(e, id)}
        className="drop-shadow-lg"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 10 L90 90 L10 90 Z" fill="#FACC15" stroke="#B45309" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={commonStyle}
      className={`${BLOCK_COLORS[type]} ${shapeClasses[type as 'square' | 'circle']} border-4 border-black/20 shadow-lg flex items-center justify-center`}
      onMouseDown={(e) => onMouseDown(e, id)}
      onTouchStart={(e) => onMouseDown(e, id)}
    >
      <div className="w-1/2 h-1/2 bg-white/20 rounded-full" />
    </div>
  );
};

export default Block;