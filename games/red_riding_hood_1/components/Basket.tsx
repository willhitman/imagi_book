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
      style={{
        position: 'relative',
        transition: 'all 300ms',
        transform: isHovered ? 'scale(1.1) translateX(-50%)' : 'scale(1) translateX(-50%)',
        width: '160px',
        height: '140px',
        left: '50%'
      }}
    >
      {/* Basket Handle (Back) */}
      <div style={{
        position: 'absolute',
        top: '-48px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '128px',
        height: '96px',
        border: '8px solid #92400e', // amber-800
        borderRadius: '9999px 9999px 0 0',
        zIndex: 0
      }} />

      {/* Basket Body */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '96px',
        backgroundColor: '#d97706', // amber-600
        borderRadius: '0 0 1.5rem 1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '4px solid #92400e',
        overflow: 'hidden'
      }}>
        {/* Wicker Pattern Texture effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          background: 'radial-gradient(circle at center, black, transparent)'
        }} />

        {/* Label */}
        <span style={{
          color: '#fef3c7', // amber-100
          fontWeight: 'bold',
          fontSize: '1.125rem',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          zIndex: 30
        }}>Basket</span>

        {/* Mini progress bar inside basket */}
        <div style={{
          width: '96px',
          height: '8px',
          backgroundColor: 'rgba(69, 26, 3, 0.5)', // amber-950/50
          borderRadius: '9999px',
          marginTop: '8px',
          zIndex: 30,
          overflow: 'hidden'
        }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#4ade80', // green-400
              transition: 'all 500ms',
              width: `${fillPercentage}%`
            }}
          />
        </div>
      </div>

      {/* Flowers inside visuals (simple stacking effect) */}
      <div style={{
        position: 'absolute',
        bottom: '64px',
        left: '16px',
        right: '16px',
        height: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '4px',
        zIndex: 10
      }}>
        {inventory[FlowerType.RED_ROSE] > 0 && <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />}
        {inventory[FlowerType.BLUE_VIOLET] > 0 && <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />}
        {inventory[FlowerType.YELLOW_DAISY] > 0 && <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#facc15', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />}
      </div>

      {/* Drop Zone Glow */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: '-16px',
          border: '4px dashed #facc15',
          borderRadius: '0.75rem',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }} />
      )}
    </div>
  );
});

Basket.displayName = 'Basket';

export default Basket;