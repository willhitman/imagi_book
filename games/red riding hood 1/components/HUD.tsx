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
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '1rem',
      pointerEvents: 'none',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'row', // Assuming landscape game usually, but inline styles allow media queries less easily. We'll default to row or column based on logic or just use flex-wrap.
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem'
    }}>

      {/* Top Left: Score & Time */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0' }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          padding: '0.75rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '2px solid #fef3c7', // amber-100
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Clock size={20} color="#d97706" />
          <span style={{
            fontWeight: 'bold',
            fontSize: '1.25rem',
            fontFamily: 'monospace',
            color: timeLeft < 30 ? '#ef4444' : '#374151'
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          padding: '0.75rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '2px solid #fef3c7',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Trophy size={20} color="#eab308" />
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#374151' }}>{score}</span>
        </div>
      </div>

      {/* Center/Right: Finish Button */}
      <div style={{ pointerEvents: 'auto' }}>
        {canFinish && (
          <button
            onClick={onFinish}
            style={{
              backgroundColor: '#22c55e',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '4px solid #bbf7d0', // green-200
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>Finish!</span>
            <Check size={24} />
          </button>
        )}
      </div>

      {/* Top Right: Objective List */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        border: '2px solid #fef3c7',
        marginTop: 0
      }}>
        <h3 style={{
          color: '#6b7280',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem'
        }}>Required Flowers</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[FlowerType.RED_ROSE, FlowerType.BLUE_VIOLET, FlowerType.YELLOW_DAISY].map((type) => {
            const count = inventory[type] || 0;
            const target = required[type];
            const isComplete = count >= target;

            // Map Tailwind colors to hex for inline
            let bgHex = '#f3f4f6';
            let dotHex = '#d1d5db';

            if (isComplete) {
              bgHex = '#dcfce7'; // green-100
            }

            if (type === FlowerType.RED_ROSE) dotHex = '#ef4444';
            else if (type === FlowerType.BLUE_VIOLET) dotHex = '#3b82f6';
            else if (type === FlowerType.YELLOW_DAISY) dotHex = '#facc15';

            return (
              <div key={type} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: isComplete ? 0.5 : 1.0,
                filter: isComplete ? 'grayscale(100%)' : 'none'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem',
                  backgroundColor: bgHex
                }}>
                  <div style={{ width: '1rem', height: '1rem', borderRadius: '9999px', backgroundColor: dotHex }} />
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: isComplete ? '#16a34a' : '#374151'
                }}>
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
