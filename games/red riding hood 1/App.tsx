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
    if (!containerRef.current) return;
    
    // Safety margin to prevent spawning on edges or directly on basket
    const margin = 50;
    const { clientWidth, clientHeight } = containerRef.current;
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

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none">
      {/* Generated Animated Background */}
      <ForestBackground />
      
      {/* Game Field */}
      <div ref={containerRef} className="relative w-full h-full z-10">
        {flowers.map((flower) => (
          <Flower
            key={flower.id}
            data={flower}
            containerRef={containerRef}
            onDragEnd={handleDragEnd}
          />
        ))}
        
        {/* Basket Position */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-amber-200">
            {gameState.status === 'START' && (
              <>
                <h1 className="text-3xl font-bold text-amber-800 mb-4">Little Red's Flowers</h1>
                <p className="text-gray-600 mb-6">
                  Help Little Red Riding Hood fill her basket!
                  <br />
                  Drag the required flowers into the basket before time runs out.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-red-500 mb-1"/> <span className="text-xs">Rose</span></div>
                    <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-blue-500 mb-1"/> <span className="text-xs">Violet</span></div>
                    <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-yellow-400 mb-1"/> <span className="text-xs">Daisy</span></div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play size={20} /> Start Game
                </button>
              </>
            )}

            {gameState.status === 'FINISHED' && (
              <>
                <h1 className="text-4xl font-bold text-green-600 mb-2">Wonderful!</h1>
                <p className="text-gray-600 mb-6">Grandma will be so pleased.</p>
                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 uppercase">Final Score</p>
                    <p className="text-5xl font-bold text-amber-600">{gameState.score}</p>
                    <p className="text-xs text-gray-400 mt-2">Time Bonus: +{gameState.timeLeft * TIME_BONUS_MULTIPLIER}</p>
                </div>
                <button
                  onClick={startGame}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </>
            )}

            {gameState.status === 'GAME_OVER' && (
              <>
                <h1 className="text-3xl font-bold text-gray-700 mb-4">Time's Up!</h1>
                <p className="text-gray-600 mb-6">You didn't collect enough flowers in time.</p>
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 uppercase">Score</p>
                    <p className="text-4xl font-bold text-gray-600">{gameState.score}</p>
                </div>
                <button
                  onClick={startGame}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-full transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> Try Again
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