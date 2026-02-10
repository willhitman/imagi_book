import React, { useState } from 'react';
import RaceGame from './components/RaceGame';
import { GameState } from './types';
import { Turtle, Trophy, Timer, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);

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
      width: '100%',
      height: '100vh',
      backgroundColor: '#064e3b', // emerald-900
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {gameState === GameState.MENU && (
        <div style={{
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          padding: '2rem',
          borderRadius: '1.5rem',
          border: '4px solid #34d399', // emerald-400
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#10b981', // emerald-500
              padding: '1rem',
              borderRadius: '9999px',
              border: '4px solid white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Turtle size={64} color="white" />
            </div>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            color: '#6ee7b7', // emerald-300
            marginBottom: '0.5rem',
            textShadow: '0 4px 6px rgba(0,0,0,0.1)',
            lineHeight: 1.1
          }}>
            TORTOISE<br />TURBO
          </h1>
          <p style={{
            color: '#d1fae5', // emerald-100
            fontSize: '1.125rem',
            marginBottom: '1.5rem',
            fontWeight: 500
          }}>
            The Hare is fast, but he gets lazy. <br />
            Grab <span style={{ color: '#fde047', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Zap size={16} fill="currentColor" /> Peppers</span> to boost!
          </p>

          <button
            onClick={() => setGameState(GameState.RACING)}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#facc15', // yellow-400
              color: '#713f12', // yellow-900
              fontWeight: 900,
              fontSize: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(161,98,7)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(161,98,7)';
            }}
          >
            START RACE
          </button>

          <button
            onClick={handleQuit}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#ef4444', // red-500
              color: 'white',
              fontWeight: 900,
              fontSize: '1.25rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(185,28,28)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(185,28,28)';
            }}
          >
            QUIT
          </button>

          <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'rgba(110, 231, 183, 0.6)', fontFamily: 'monospace' }}>
            Tap Left / Right to Steer
          </div>
        </div>
      )}

      {gameState === GameState.RACING && (
        <RaceGame onGameOver={(won) => setGameState(won ? GameState.WON : GameState.LOST)} />
      )}

      {gameState === GameState.WON && (
        <div style={{
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          padding: '2rem',
          borderRadius: '1.5rem',
          border: '4px solid #facc15', // yellow-400
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#eab308', // yellow-500
              padding: '1rem',
              borderRadius: '9999px',
              border: '4px solid white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              animation: 'bounce 1s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={64} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fde047', marginBottom: '0.5rem', textShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>VICTORY!</h1>
          <p style={{ color: '#fef9c3', fontSize: '1.125rem', marginBottom: '2rem' }}>
            Slow and steady? No way.<br />Fast and boosted won the race!
          </p>
          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#10b981', // emerald-500
              color: 'white',
              fontWeight: 900,
              fontSize: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(6,95,70)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(6,95,70)';
            }}
          >
            CONTINUE
          </button>
          <button
            onClick={handleQuit}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: 900,
              fontSize: '1.25rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(185,28,28)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(185,28,28)';
            }}
          >
            QUIT
          </button>
        </div>
      )}

      {gameState === GameState.LOST && (
        <div style={{
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          padding: '2rem',
          borderRadius: '1.5rem',
          border: '4px solid #f87171', // red-400
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#ef4444', // red-500
              padding: '1rem',
              borderRadius: '9999px',
              border: '4px solid white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Timer size={64} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fca5a5', marginBottom: '0.5rem', textShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>TOO SLOW!</h1>
          <p style={{ color: '#fee2e2', fontSize: '1.125rem', marginBottom: '2rem' }}>
            The Hare crossed the line first.<br />Grab more peppers next time!
          </p>
          <button
            onClick={() => setGameState(GameState.RACING)}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#10b981', // emerald-500
              color: 'white',
              fontWeight: 900,
              fontSize: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(6,95,70)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(6,95,70)';
            }}
          >
            TRY AGAIN
          </button>

          <button
            onClick={handleQuit}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: 900,
              fontSize: '1.25rem',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 0 rgb(185,28,28)',
              transition: 'all 0.1s',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 rgb(185,28,28)';
            }}
          >
            QUIT
          </button>
        </div>
      )}
    </div>
  );
};

export default App;