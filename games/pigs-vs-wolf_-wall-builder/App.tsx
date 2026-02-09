import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameBlock, BlockType, FloatingText } from './types';
import { GAME_DURATION, TARGET_WALL_HEIGHT, SPAWN_INTERVAL, BLOCK_SIZE, MATCH_DISTANCE, TOTAL_WALL_HEIGHT_PIXELS } from './constants';
import { WolfSVG, PigsSVG } from './components/Characters';
import Block from './components/Block';
import { generateEndGameStory } from './services/aiService';

// Helper to get random block
const createRandomBlock = (w: number, h: number): GameBlock => {
  const types: BlockType[] = ['square', 'circle', 'triangle'];
  const type = types[Math.floor(Math.random() * types.length)];
  const colors = ['#EF4444', '#3B82F6', '#EAB308'];
  
  // Spawn in the middle-ish area
  const padding = 60;
  const x = padding + Math.random() * (w - padding * 2 - BLOCK_SIZE);
  const y = padding + Math.random() * (h / 2); // Top half only

  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    x,
    y,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [wallHealth, setWallHealth] = useState(0); // 0 to 100
  const [blocks, setBlocks] = useState<GameBlock[]>([]);
  const [story, setStory] = useState<string | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  // Dragging State
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Timers
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setTimeLeft(GAME_DURATION);
    setWallHealth(0);
    setBlocks([]);
    setStory(null);
    setFloatingTexts([]);
    setShowOverlay(false);
    lastSpawnRef.current = Date.now();
  };

  const handleEndGame = useCallback(async (win: boolean) => {
    setGameState(win ? GameState.WIN : GameState.LOSE);
    
    // Generate story immediately
    const generatedStory = await generateEndGameStory(win);
    setStory(generatedStory);

    // If lost, delay overlay to show animation. If won, show immediately.
    if (win) {
      setShowOverlay(true);
    } else {
      setTimeout(() => {
        setShowOverlay(true);
      }, 2000); // 2s delay to match animation duration
    }
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const loop = () => {
      const now = Date.now();

      // Timer
      setTimeLeft((prev) => {
        const newVal = prev - 0.016; // Approx 60fps
        if (newVal <= 0) {
            // Trigger Wolf Blow
            setGameState(GameState.WOLF_BLOWING);
            return 0;
        }
        return newVal;
      });

      // Spawning logic
      if (now - lastSpawnRef.current > SPAWN_INTERVAL) {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          setBlocks(prev => {
            if (prev.length > 10) return prev; // Limit max blocks
            return [...prev, createRandomBlock(clientWidth, clientHeight)];
          });
          lastSpawnRef.current = now;
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState]);

  // Handle Wolf Blowing State Transition
  useEffect(() => {
    if (gameState === GameState.WOLF_BLOWING) {
      // Wait for animation (3 seconds), then decide fate
      const timer = setTimeout(() => {
        const win = wallHealth >= TARGET_WALL_HEIGHT;
        handleEndGame(win);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, wallHealth, handleEndGame]);

  // Input Handling
  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (gameState !== GameState.PLAYING) return;
    e.preventDefault(); // Prevent scroll on touch
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const block = blocks.find(b => b.id === id);
    if (!block || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    dragOffset.current = { x: relX - block.x, y: relY - block.y };
    draggingId.current = id;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingId.current || !containerRef.current || gameState !== GameState.PLAYING) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();

    const x = clientX - rect.left - dragOffset.current.x;
    const y = clientY - rect.top - dragOffset.current.y;

    setBlocks(prev => prev.map(b => b.id === draggingId.current ? { ...b, x, y } : b));
  };

  const handleEndDrag = () => {
    if (!draggingId.current || gameState !== GameState.PLAYING) {
        draggingId.current = null;
        return;
    }

    const activeId = draggingId.current;
    const activeBlock = blocks.find(b => b.id === activeId);

    if (activeBlock) {
      // Check collision with same type
      const match = blocks.find(b => 
        b.id !== activeId && 
        b.type === activeBlock.type &&
        Math.hypot(b.x - activeBlock.x, b.y - activeBlock.y) < MATCH_DISTANCE
      );

      if (match) {
        // Merge!
        // Remove both
        setBlocks(prev => prev.filter(b => b.id !== activeId && b.id !== match.id));
        
        // Add to Wall
        const addedHeight = 6; // %
        setWallHealth(prev => Math.min(prev + addedHeight, 100));

        // Floating Text Effect
        const floatId = Date.now().toString();
        setFloatingTexts(prev => [...prev, { 
            id: floatId, 
            x: (activeBlock.x + match.x)/2, 
            y: (activeBlock.y + match.y)/2, 
            text: '+Wall!' 
        }]);
        
        // Remove floating text after animation
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== floatId));
        }, 1000);
      }
    }

    draggingId.current = null;
  };

  // Helper styles based on state
  const getWolfState = () => {
    if (gameState === GameState.WOLF_BLOWING) return 'blowing';
    if (gameState === GameState.WIN) return 'sad';
    if (gameState === GameState.LOSE) return 'happy';
    return 'idle';
  };

  const getPigState = () => {
    if (gameState === GameState.WOLF_BLOWING) return 'scared';
    if (gameState === GameState.WIN) return 'happy';
    if (gameState === GameState.LOSE) return 'crying';
    return 'idle';
  };

  return (
    <div 
      className="w-full h-screen bg-sky-300 overflow-hidden relative font-sans select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      {/* Background Sun/Cloud */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full blur-md opacity-80 animate-pulse"></div>
      <div className="absolute top-20 right-20 w-40 h-20 bg-white rounded-full opacity-60 blur-sm"></div>

      {/* Ground */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-green-600 to-green-400 z-0"></div>

      {/* Game Area Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-10"
      >
        {/* Play Area (Top part where blocks fly) */}
        
        {/* Render Blocks */}
        {blocks.map(block => (
            <Block 
                key={block.id} 
                block={block} 
                onMouseDown={handleStartDrag}
                isDragging={draggingId.current === block.id}
            />
        ))}

        {/* Floating Texts */}
        {floatingTexts.map(ft => (
            <div 
                key={ft.id}
                className="absolute text-yellow-300 font-bold text-2xl animate-bounce"
                style={{ left: ft.x, top: ft.y, pointerEvents: 'none', textShadow: '2px 2px 0 #000' }}
            >
                {ft.text}
            </div>
        ))}
      </div>

      {/* Characters & Wall Layer */}
      
      {/* WOLF (Left) */}
      <div className={`absolute bottom-10 left-4 z-20 transition-transform duration-500 ${gameState === GameState.WOLF_BLOWING ? 'scale-125' : 'scale-100'}`}>
        <WolfSVG className="w-32 h-32 md:w-48 md:h-48 drop-shadow-xl" state={getWolfState()} />
      </div>

      {/* PIGS (Right) */}
      <div className={`absolute bottom-10 right-4 z-20 ${gameState === GameState.LOSE ? 'animate-blown-away' : ''}`}>
        <PigsSVG className="w-40 h-24 md:w-60 md:h-36 drop-shadow-xl" state={getPigState()} />
      </div>

      {/* WALL (Center) */}
      <div className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 z-15 w-32 md:w-48 flex flex-col-reverse items-center justify-end">
          {/* Target Line Indicator */}
          <div 
             className="absolute w-64 border-t-4 border-dashed border-white opacity-50 flex items-center justify-center"
             style={{ bottom: TOTAL_WALL_HEIGHT_PIXELS }}
          >
             <span className="bg-black/30 text-white px-2 rounded text-xs -mt-6">Goal Height</span>
          </div>

          {/* Wall Logic */}
          {gameState === GameState.LOSE ? (
             <div className="relative w-full" style={{ height: `${(wallHealth / 100) * TOTAL_WALL_HEIGHT_PIXELS}px` }}>
                {/* Break into 3 parts for crumbling effect */}
                <div className="absolute bottom-0 w-full h-1/3 brick-pattern border-4 border-red-900 animate-crumble-center"></div>
                <div className="absolute bottom-1/3 w-full h-1/3 brick-pattern border-4 border-red-900 animate-crumble-left"></div>
                <div className="absolute bottom-2/3 w-full h-1/3 brick-pattern border-4 border-red-900 rounded-t-lg animate-crumble-right"></div>
             </div>
          ) : (
            <div 
                className={`w-full brick-pattern border-4 border-red-900 rounded-t-lg shadow-2xl transition-all duration-300 ease-out origin-bottom ${gameState === GameState.WOLF_BLOWING ? 'animate-shake' : ''}`}
                style={{ 
                    height: `${(wallHealth / 100) * TOTAL_WALL_HEIGHT_PIXELS}px`,
                }}
            ></div>
          )}
          
          {/* Base */}
          <div className="w-40 md:w-56 h-4 bg-gray-700 rounded-full mt-[-2px]"></div>
      </div>

      {/* Dynamic Wind Animation (Only when blowing) */}
      {gameState === GameState.WOLF_BLOWING && (
          <div className="absolute bottom-32 left-32 z-30 pointer-events-none">
              {/* Generate dynamic wind lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                  <div
                      key={i}
                      className="absolute h-1 bg-white/70 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      style={{
                          width: `${60 + Math.random() * 80}px`,
                          top: `${(i * 15) - 20}px`,
                          left: '0px',
                          animation: `windFlow ${0.5 + Math.random() * 0.5}s linear infinite`,
                          animationDelay: `${Math.random() * 0.5}s`
                      }}
                  />
              ))}
              {/* Add particles */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                      key={`p-${i}`}
                      className="absolute w-2 h-2 bg-gray-200/50 rounded-full"
                      style={{
                          top: `${(i * 10) - 20}px`,
                          left: '0px',
                          animation: `windFlow ${0.8 + Math.random() * 0.4}s linear infinite`,
                          animationDelay: `${Math.random() * 1}s`
                      }}
                  />
              ))}
          </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-0 w-full flex justify-between px-8 z-50 pointer-events-none">
        <div className="bg-white/80 rounded-xl p-3 border-4 border-gray-800 shadow-lg">
           <span className="text-xl font-black text-gray-800">Time: {Math.ceil(timeLeft)}s</span>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border-4 border-gray-800 shadow-lg flex gap-2 items-center">
            <span className="text-xl font-black text-gray-800">Wall: {Math.floor(wallHealth)}%</span>
            <div className="w-32 h-4 bg-gray-300 rounded-full overflow-hidden border border-gray-600">
                <div 
                    className={`h-full ${wallHealth >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: `${Math.min(wallHealth, 100)}%` }}
                ></div>
            </div>
        </div>
      </div>

      {/* Start Overlay */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                Pigs vs Wolf
            </h1>
            <div className="bg-white p-8 rounded-3xl max-w-lg shadow-2xl border-b-8 border-gray-300">
                <p className="text-xl text-gray-700 mb-6">
                    Quick! Drag matching shapes together to build the wall. 
                    <br/><br/>
                    Reach <strong className="text-red-600">100% height</strong> before the timer runs out to save the pigs!
                </p>
                <button 
                    onClick={startGame}
                    className="bg-green-500 hover:bg-green-600 text-white text-3xl font-bold py-4 px-12 rounded-full shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all"
                >
                    Build!
                </button>
            </div>
        </div>
      )}

      {/* Game Over / Win Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
             <h2 className={`text-6xl font-black mb-6 ${gameState === GameState.WIN ? 'text-green-400' : 'text-red-400'} drop-shadow-lg`}>
                {gameState === GameState.WIN ? 'YOU WON!' : 'THE WALL FELL!'}
            </h2>
            
            <div className="bg-white p-8 rounded-3xl max-w-lg shadow-2xl border-b-8 border-gray-300 relative">
                {/* AI Story Section */}
                <div className="mb-6 min-h-[80px] flex items-center justify-center">
                    {story ? (
                        <p className="text-2xl font-serif italic text-gray-800 leading-relaxed">
                            "{story}"
                        </p>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-sm text-gray-500">Asking the Storyteller...</span>
                        </div>
                    )}
                </div>

                <button 
                    onClick={startGame}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold py-3 px-10 rounded-full shadow-[0_4px_0_rgb(30,64,175)] active:shadow-none active:translate-y-1 transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
      )}
    </div>
  );
}