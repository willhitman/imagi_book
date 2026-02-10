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

  const getBlockStyles = (type: BlockType): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      border: '4px solid rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    };

    // Inline color mapping
    const colors: Record<string, string> = {
      square: '#ef4444', // red-500
      circle: '#3b82f6', // blue-500
      triangle: '#facc15' // yellow-400
    };

    // Inline shape mapping
    const borderRadius = type === 'circle' ? '9999px' : '0.375rem'; // rounded-full vs rounded-md

    return {
      ...baseStyle,
      backgroundColor: colors[type],
      borderRadius
    };
  };


  if (type === 'triangle') {
    // Custom SVG for triangle to make it cleaner than CSS border hacks
    return (
      <div
        style={commonStyle}
        onMouseDown={(e) => onMouseDown(e, id)}
        onTouchStart={(e) => onMouseDown(e, id)}
      >
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))' }}>
          <path d="M50 10 L90 90 L10 90 Z" fill="#FACC15" stroke="#B45309" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ ...commonStyle, ...getBlockStyles(type) }}
      onMouseDown={(e) => onMouseDown(e, id)}
      onTouchStart={(e) => onMouseDown(e, id)}
    >
      <div style={{ width: '50%', height: '50%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px' }} />
    </div>
  );
};

export default Block;