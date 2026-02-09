import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LEVEL_CONFIG, FLOWER_SCORE, TIME_BONUS_MULTIPLIER } from './constants';
import { FlowerType, FlowerData, GameState } from './types';
import Flower from './components/Flower';
import Basket from './components/Basket';
import HUD from './components/HUD';
import ForestBackground from './components/ForestBackground';
import { Play, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);

  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    timeLeft: LEVEL_CONFIG.timeLimit,
    inventory: {
      [FlowerType.RED_ROSE]: 0,
      [FlowerType.BLUE_VIOLET]: 0,
      [FlowerType.YELLOW_DAISY]: 0,
      [FlowerType.WHITE_WEED]: 0,
    },
  });

  const [flowers, setFlowers] = useState<FlowerData[]>([]);
  const [basketHovered, setBasketHovered] = useState(false);

  // --- Initialization ---
  const spawnFlowers = useCallback(() => {
    console.log('spawnFlowers called. containerRef:', containerRef.current);
    if (!containerRef.current) return;

    // Safety margin to prevent spawning on edges or directly on basket
    const margin = 50;
    const { clientWidth, clientHeight } = containerRef.current;
    console.log('Container dimensions:', clientWidth, clientHeight);

    if (clientWidth === 0 || clientHeight === 0) {
      console.warn('Container has 0 dimension, retrying in 100ms');
      setTimeout(spawnFlowers, 100);
      return;
    }

    const basketZoneHeight = 200; // Bottom area reserved for basket

    const newFlowers: FlowerData[] = [];
    let idCounter = 0;

    Object.entries(LEVEL_CONFIG.spawnCounts).forEach(([typeStr, count]) => {
      const type = typeStr as FlowerType;
      for (let i = 0; i < count; i++) {
        newFlowers.push({
          id: `flower-${type}-${idCounter++}`,
          type,
          x: margin + Math.random() * (clientWidth - margin * 2),
          y: margin + Math.random() * (clientHeight - basketZoneHeight - margin), // Keep upper part
          rotation: Math.random() * 360,
        });
      }
    });

    console.log(`Spawned ${newFlowers.length} flowers`);
    setFlowers(newFlowers);
  }, []);

  const startGame = () => {
    setGameState({
      status: 'PLAYING',
      score: 0,
      timeLeft: LEVEL_CONFIG.timeLimit,
      inventory: {
        [FlowerType.RED_ROSE]: 0,
        [FlowerType.BLUE_VIOLET]: 0,
        [FlowerType.YELLOW_DAISY]: 0,
        [FlowerType.WHITE_WEED]: 0,
      },
    });
    spawnFlowers();
  };

  // --- Game Loop (Timer) ---
  useEffect(() => {
    if (gameState.status !== 'PLAYING') return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          return { ...prev, status: 'GAME_OVER', timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.status]);

  // --- Interaction Handlers ---
  const handleDragEnd = (id: string, point: { x: number; y: number }) => {
    if (gameState.status !== 'PLAYING' || !basketRef.current) return;

    const basketRect = basketRef.current.getBoundingClientRect();

    // Check if drop point is within basket rect
    // Note: Point is client coordinates from framer-motion
    if (
      point.x >= basketRect.left &&
      point.x <= basketRect.right &&
      point.y >= basketRect.top &&
      point.y <= basketRect.bottom
    ) {
      collectFlower(id);
      setBasketHovered(true);
      setTimeout(() => setBasketHovered(false), 200); // Pulse effect
    }
  };

  const collectFlower = (id: string) => {
    const flower = flowers.find((f) => f.id === id);
    if (!flower) return;

    // Remove flower from field
    setFlowers((prev) => prev.filter((f) => f.id !== id));

    // Update inventory and score
    setGameState((prev) => {
      const newCount = (prev.inventory[flower.type] || 0) + 1;
      const required = LEVEL_CONFIG.required[flower.type];

      // Calculate score delta
      let scoreDelta = 0;
      if (flower.type !== FlowerType.WHITE_WEED) {
        // Only score if we haven't exceeded requirements, or maybe small points for extras?
        // Let's say strictly helpful items score points.
        scoreDelta = FLOWER_SCORE;
      } else {
        scoreDelta = -5; // Penalty for weeds
      }

      return {
        ...prev,
        score: prev.score + scoreDelta,
        inventory: {
          ...prev.inventory,
          [flower.type]: newCount,
        },
      };
    });
  };

  const checkWinCondition = () => {
    const { inventory } = gameState;
    const req = LEVEL_CONFIG.required;
    return (
      inventory[FlowerType.RED_ROSE] >= req[FlowerType.RED_ROSE] &&
      inventory[FlowerType.BLUE_VIOLET] >= req[FlowerType.BLUE_VIOLET] &&
      inventory[FlowerType.YELLOW_DAISY] >= req[FlowerType.YELLOW_DAISY]
    );
  };

  const handleFinish = () => {
    const timeBonus = gameState.timeLeft * TIME_BONUS_MULTIPLIER;
    setGameState((prev) => ({
      ...prev,
      status: 'FINISHED',
      score: prev.score + timeBonus,
    }));
  };

  // --- Render ---
  const canFinish = checkWinCondition() && gameState.status === 'PLAYING';

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
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
      userSelect: 'none'
    }}>
      {/* Generated Animated Background */}
      <ForestBackground />

      {/* Game Field */}
      <div ref={containerRef} style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: 10
      }}>
        {flowers.map((flower) => (
          <Flower
            key={flower.id}
            data={flower}
            containerRef={containerRef}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Basket Position */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20
        }}>
          <Basket
            ref={basketRef}
            isHovered={basketHovered}
            inventory={gameState.inventory}
            required={LEVEL_CONFIG.required}
          />
        </div>
      </div>

      {/* UI Overlay */}
      {gameState.status === 'PLAYING' && (
        <HUD
          score={gameState.score}
          timeLeft={gameState.timeLeft}
          inventory={gameState.inventory}
          required={LEVEL_CONFIG.required}
          onFinish={handleFinish}
          canFinish={canFinish}
        />
      )}

      {/* Start / Game Over Screens */}
      {gameState.status !== 'PLAYING' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            border: '4px solid #fde68a' // amber-200
          }}>
            {gameState.status === 'START' && (
              <>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#92400e', marginBottom: '1rem' }}>Little Red's Flowers</h1>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
                  Help Little Red Riding Hood fill her basket!
                  <br />
                  Drag the required flowers into the basket before time runs out.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#ef4444', marginBottom: '0.25rem' }} /> <span style={{ fontSize: '0.75rem' }}>Rose</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#3b82f6', marginBottom: '0.25rem' }} /> <span style={{ fontSize: '0.75rem' }}>Violet</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#facc15', marginBottom: '0.25rem' }} /> <span style={{ fontSize: '0.75rem' }}>Daisy</span></div>
                </div>
                <button
                  onClick={startGame}
                  style={{
                    width: '100%',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Play size={20} /> Start Game
                </button>
                <button
                  onClick={handleQuit}
                  style={{
                    width: '100%',
                    backgroundColor: '#991b1b', // red-800
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Quit Adventure
                </button>
              </>
            )}

            {gameState.status === 'FINISHED' && (
              <>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '0.5rem' }}>Wonderful!</h1>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Grandma will be so pleased.</p>
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Final Score</p>
                  <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#d97706' }}>{gameState.score}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>Time Bonus: +{gameState.timeLeft * TIME_BONUS_MULTIPLIER}</p>
                </div>
                <button
                  onClick={handleContinue}
                  style={{
                    width: '100%',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <RotateCcw size={20} /> Continue
                </button>
                <button
                  onClick={handleQuit}
                  style={{
                    width: '100%',
                    backgroundColor: '#991b1b',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Quit Adventure
                </button>
              </>
            )}

            {gameState.status === 'GAME_OVER' && (
              <>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '1rem' }}>Time's Up!</h1>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>You didn't collect enough flowers in time.</p>
                <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Score</p>
                  <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#4b5563' }}>{gameState.score}</p>
                </div>
                <button
                  onClick={startGame}
                  style={{
                    width: '100%',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <RotateCcw size={20} /> Try Again
                </button>
                <button
                  onClick={handleQuit}
                  style={{
                    width: '100%',
                    backgroundColor: '#991b1b',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '9999px',
                    transition: 'transform 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Quit Adventure
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;