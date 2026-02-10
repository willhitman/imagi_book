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

  const handleContinue = () => {
    // @ts-ignore
    if (window.GameChannel) {
      // @ts-ignore
      window.GameChannel.postMessage('GAME_COMPLETE');
    } else {
      console.log('GameChannel not found');
    }
  };

  const handleQuit = () => {
    // @ts-ignore
    if (window.GameChannel) {
      // @ts-ignore
      window.GameChannel.postMessage('GAME_QUIT');
    } else {
      console.log('GameChannel not found, simulating quit');
      window.close();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1rem',
      zIndex: 10,
      fontFamily: 'Fredoka One, sans-serif',
      color: 'white'
    }}>
      {/* Top HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))'
      }}>
        {/* P1 Score Block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem', letterSpacing: '0.05em', color: '#ff1744', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>HOOD</span>
          <div style={{
            width: '8rem',
            height: '1.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'relative',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(to right, #ef4444, #ec4899)',
              position: 'absolute',
              top: 0,
              left: 0,
              transition: 'all 1s',
              width: '100%'
            }}></div>
          </div>
          <span style={{ marginTop: '0.25rem', fontSize: '1.125rem' }}>SCORE: {score}</span>
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.5))' }}>
            {formatTime(time)}
          </div>
        </div>

        {/* P2/Enemy Block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '1.25rem', letterSpacing: '0.05em', color: '#90a4ae', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>WOLF</span>
          <div style={{
            width: '8rem',
            height: '1.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'relative',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(to left, #6b7280, #475569)',
              position: 'absolute',
              top: 0,
              right: 0,
              transition: 'all 0.2s',
              width: `${100 - progress}%`
            }}></div>
          </div>
          <span style={{ marginTop: '0.25rem', fontSize: '1.125rem', color: '#d1d5db' }}>DISTANCE</span>
        </div>
      </div>

      {/* Center Screen Messages */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}>
        {gameState === GameState.START && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            textAlign: 'center',
            borderBottom: '8px solid #bfdbfe',
            color: '#1e293b'
          }}>
            <h1 style={{ fontSize: '3.75rem', color: '#ff1744', marginBottom: '0.5rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Forest Dash!</h1>
            <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '1.25rem' }}>
              TAP to JUMP • HOLD to SLIDE
            </p>
            <button
              onClick={onStart}
              style={{
                backgroundColor: '#43a047',
                color: 'white',
                fontSize: '1.875rem',
                padding: '0.75rem 2.5rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 #1b5e20',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #1b5e20';
              }}
            >
              PLAY
            </button>
            <button
              onClick={handleQuit}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '1.5rem',
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 #b91c1c',
                cursor: 'pointer',
                transition: 'all 0.1s',
                marginTop: '1rem',
                marginLeft: '1rem'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #b91c1c';
              }}
            >
              QUIT
            </button>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            borderBottom: '8px solid #fecaca',
            color: '#1e293b'
          }}>
            <h1 style={{ fontSize: '3.75rem', color: '#1e293b', marginBottom: '0.5rem' }}>Oh No!</h1>
            <p style={{ color: '#ff1744', marginBottom: '1.5rem', fontSize: '1.5rem' }}>The Wolf caught you.</p>
            <div style={{ color: '#475569', marginBottom: '2rem', fontSize: '1.25rem' }}>Final Score: {score}</div>
            <button
              onClick={onRestart}
              style={{
                backgroundColor: '#ffca28',
                color: 'white',
                fontSize: '1.5rem',
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 #f57f17',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #f57f17';
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleQuit}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '1.25rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 #b91c1c',
                cursor: 'pointer',
                transition: 'all 0.1s',
                marginTop: '1rem',
                marginLeft: '1rem'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #b91c1c';
              }}
            >
              QUIT
            </button>
          </div>
        )}

        {gameState === GameState.VICTORY && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '2rem',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            borderBottom: '8px solid #bbf7d0',
            color: '#1e293b'
          }}>
            <h1 style={{ fontSize: '3.75rem', color: '#43a047', marginBottom: '1rem' }}>You Escaped!</h1>
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Grandma is safe!</p>
            <div style={{ color: '#1e293b', marginBottom: '2rem', fontSize: '1.875rem' }}>Total Score: {score + (time * 100)}</div>
            <button
              onClick={handleContinue}
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                fontSize: '1.5rem',
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 rgb(21, 128, 61)',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 rgb(21, 128, 61)';
              }}
            >
              Continue
            </button>
            <button
              onClick={handleQuit}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '1.25rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 4px 0 #b91c1c',
                cursor: 'pointer',
                transition: 'all 0.1s',
                marginTop: '1rem',
                marginLeft: '1rem'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #b91c1c';
              }}
            >
              QUIT
            </button>
          </div>
        )}
      </div>

      {/* Controls Overlay Hint */}
      {gameState === GameState.PLAYING && (
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          opacity: 0.7,
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '1.25rem', filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' }}>HOLD ↓</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '1.25rem', filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))' }}>TAP ↥</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;