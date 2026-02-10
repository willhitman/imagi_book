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
  const [targetShape, setTargetShape] = useState<BlockType>('square');
  const [showOverlay, setShowOverlay] = useState(false);

  // Helper to randomize target shape
  const randomizeTargetShape = () => {
    const types: BlockType[] = ['square', 'circle', 'triangle'];
    setTargetShape(types[Math.floor(Math.random() * types.length)]);
  };

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
    randomizeTargetShape();
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

    if (activeBlock && containerRef.current) {
      // Wall Collision Detection
      const { clientWidth, clientHeight } = containerRef.current;
      const wallWidth = 128; // 8rem = 128px approx (root font size usually 16px)
      // Actually let's use a percentage based approach or fixed pixel width since standard is 1rem=16px
      // 8rem = 128px.
      const wallLeft = (clientWidth / 2) - (128 / 2);
      const wallRight = (clientWidth / 2) + (128 / 2);

      // Wall bottom starts at 20% from bottom
      const wallBottomY = clientHeight * 0.8;
      const wallTopY = wallBottomY - TOTAL_WALL_HEIGHT_PIXELS - 50; // Allow dropping a bit higher

      // Check if block center is within wall horizontal bounds and reasonably close to the wall top
      const blockCenterX = activeBlock.x + BLOCK_SIZE / 2;
      const blockCenterY = activeBlock.y + BLOCK_SIZE / 2;

      const isOverWall =
        blockCenterX > wallLeft - 20 &&
        blockCenterX < wallRight + 20 &&
        blockCenterY > wallTopY &&
        blockCenterY < wallBottomY + 50;

      if (isOverWall) {
        if (activeBlock.type === targetShape) {
          // Success! Build Wall

          // Remove block
          setBlocks(prev => prev.filter(b => b.id !== activeId));

          // Add to Wall
          const addedHeight = 6; // %
          setWallHealth(prev => Math.min(prev + addedHeight, 100));

          // New Target
          randomizeTargetShape();

          // Floating Text Effect
          const floatId = Date.now().toString();
          setFloatingTexts(prev => [...prev, {
            id: floatId,
            x: blockCenterX,
            y: blockCenterY - 50,
            text: '+Wall!'
          }]);

          // Remove floating text after animation
          setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== floatId));
          }, 1000);
        } else {
          // Wrong Shape
          const floatId = Date.now().toString();
          setFloatingTexts(prev => [...prev, {
            id: floatId,
            x: blockCenterX,
            y: blockCenterY - 50,
            text: 'Wrong Shape!'
          }]);
          setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== floatId));
          }, 1000);
        }
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

  const handleQuit = () => {
    // @ts-ignore
    if (window.GameChannel) {
      // @ts-ignore
      window.GameChannel.postMessage('GAME_QUIT');
    } else {
      console.log('GameChannel not found, simulating quit');
      window.close(); // Won't work in most browsers but okay for simulation logs
    }
  }

  const handleContinue = () => {
    // Send message to Flutter
    // @ts-ignore
    if (window.GameChannel) {
      // @ts-ignore
      window.GameChannel.postMessage('GAME_COMPLETE');
    } else {
      console.log('GameChannel not found, fallback to reload for testing');
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: '#7dd3fc', // sky-300
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'sans-serif',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      {/* Background Sun/Cloud */}
      <div style={{
        position: 'absolute',
        top: '2.5rem',
        left: '2.5rem',
        width: '6rem',
        height: '6rem',
        backgroundColor: '#fde047', // yellow-300
        borderRadius: '9999px',
        filter: 'blur(12px)',
        opacity: 0.8,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '5rem',
        right: '5rem',
        width: '10rem',
        height: '5rem',
        backgroundColor: 'white',
        borderRadius: '9999px',
        opacity: 0.6,
        filter: 'blur(4px)'
      }}></div>

      {/* Ground */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '33.333333%',
        background: 'linear-gradient(to top, #16a34a, #4ade80)', // green-600 to green-400
        zIndex: 0
      }}></div>

      {/* Game Area Container */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10
        }}
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
            style={{
              position: 'absolute',
              left: ft.x,
              top: ft.y,
              color: '#fde047', // yellow-300
              fontWeight: 700,
              fontSize: '1.5rem',
              animation: 'bounce 1s infinite',
              pointerEvents: 'none',
              textShadow: '2px 2px 0 #000'
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Characters & Wall Layer */}

      {/* WOLF (Left) */}
      <div style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '1rem',
        zIndex: 20,
        width: '8rem', // w-32
        height: '8rem', // h-32
        transition: 'transform 500ms',
        transform: gameState === GameState.WOLF_BLOWING ? 'scale(1.25)' : 'scale(1)',
        filter: 'drop-shadow(0 20px 13px rgba(0,0,0,0.1))'
      }}>
        <WolfSVG style={{ width: '100%', height: '100%' }} state={getWolfState()} />
      </div>

      {/* PIGS (Right) */}
      <div style={{
        position: 'absolute',
        bottom: '2.5rem',
        right: '1rem',
        zIndex: 20,
        width: '10rem', // w-40
        height: '6rem', // h-24
        animation: gameState === GameState.LOSE ? 'blownAway 1.5s forwards ease-in 0.2s' : 'none'
      }}>
        <PigsSVG style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 20px 13px rgba(0,0,0,0.1))' }} state={getPigState()} />
      </div>

      {/* WALL (Center) */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        width: '8rem', // w-32
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        {/* Target Line Indicator */}
        {gameState === GameState.PLAYING && (
          <div
            style={{
              position: 'absolute',
              width: '16rem',
              // borderTop: '4px dashed rgba(255,255,255,0.5)', // Removed old dashed line
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bottom: Math.min((wallHealth / 100) * TOTAL_WALL_HEIGHT_PIXELS + 20, TOTAL_WALL_HEIGHT_PIXELS), // Float above current wall
              transition: 'bottom 0.3s ease-out'
            }}
          >
            <div style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              opacity: 0.6,
              animation: 'pulse 1s infinite alternate',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))'
            }}>
              {/* Render Ghost Block */}
              <Block
                block={{ id: 'ghost', type: targetShape, x: 0, y: 0, rotation: 0, color: '#ffffff' }}
                onMouseDown={() => { }}
                isDragging={false}
              />
            </div>
            <span style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              pointerEvents: 'none'
            }}>Needs {targetShape}!</span>
          </div>
        )}

        {/* Old Goal Height indicator removed/replaced */}

        {/* Wall Logic */}
        {gameState === GameState.LOSE ? (
          <div style={{ position: 'relative', width: '100%', height: `${(wallHealth / 100) * TOTAL_WALL_HEIGHT_PIXELS}px` }}>
            {/* Break into 3 parts for crumbling effect */}
            <div className="brick-pattern" style={{ position: 'absolute', bottom: 0, width: '100%', height: '33.33%', border: '4px solid #7f1d1d', animation: 'crumbleCenter 1.5s forwards ease-in' }}></div>
            <div className="brick-pattern" style={{ position: 'absolute', bottom: '33.33%', width: '100%', height: '33.33%', border: '4px solid #7f1d1d', animation: 'crumbleLeft 1.5s forwards ease-in' }}></div>
            <div className="brick-pattern" style={{ position: 'absolute', bottom: '66.66%', width: '100%', height: '33.33%', border: '4px solid #7f1d1d', borderRadius: '0.5rem 0.5rem 0 0', animation: 'crumbleRight 1.5s forwards ease-in' }}></div>
          </div>
        ) : (
          <div
            className="brick-pattern"
            style={{
              width: '100%',
              border: '4px solid #7f1d1d', // red-900
              borderRadius: '0.5rem 0.5rem 0 0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              transition: 'all 300ms ease-out',
              transformOrigin: 'bottom',
              animation: gameState === GameState.WOLF_BLOWING ? 'shake 0.5s infinite' : 'none',
              height: `${(wallHealth / 100) * TOTAL_WALL_HEIGHT_PIXELS}px`
            }}
          ></div>
        )}

        {/* Base */}
        <div style={{
          width: '10rem', // w-40
          height: '1rem',
          backgroundColor: '#374151', // gray-700
          borderRadius: '9999px',
          marginTop: '-2px'
        }}></div>
      </div>

      {/* Dynamic Wind Animation (Only when blowing) */}
      {gameState === GameState.WOLF_BLOWING && (
        <div style={{ position: 'absolute', bottom: '8rem', left: '8rem', zIndex: 30, pointerEvents: 'none' }}>
          {/* Generate dynamic wind lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                height: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(255,255,255,0.8)',
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
              style={{
                position: 'absolute',
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: 'rgba(229,231,235,0.5)', // gray-200/50
                borderRadius: '9999px',
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
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 50,
        pointerEvents: 'none'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          border: '4px solid #1f2937',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1f2937' }}>Time: {Math.ceil(timeLeft)}s</span>
        </div>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          border: '4px solid #1f2937',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1f2937' }}>Wall: {Math.floor(wallHealth)}%</span>
          <div style={{ width: '8rem', height: '1rem', backgroundColor: '#d1d5db', borderRadius: '9999px', overflow: 'hidden', border: '1px solid #4b5563' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(wallHealth, 100)}%`,
                backgroundColor: wallHealth >= 100 ? '#22c55e' : '#f97316'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Start Overlay */}
      {gameState === GameState.START && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: 'white',
            marginBottom: '2rem',
            textShadow: '0 5px 5px rgba(0,0,0,0.8)'
          }}>
            Pigs vs Wolf
          </h1>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1.5rem',
            maxWidth: '32rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderBottom: '8px solid #d1d5db'
          }}>
            <p style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Drag shapes one by one to the wall to build it!
            </p>
            <button
              onClick={startGame}
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                fontSize: '1.875rem',
                fontWeight: 'bold',
                padding: '1rem 3rem',
                borderRadius: '9999px',
                boxShadow: '0 4px 0 rgb(21,128,61)',
                transition: 'all 0.1s',
                cursor: 'pointer',
                border: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 rgb(21,128,61)';
              }}
            >
              Build!
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Win Overlay */}
      {showOverlay && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          textAlign: 'center',
          animation: 'fadeIn 0.5s'
        }}>
          <h2 style={{
            fontSize: '3.75rem',
            fontWeight: 900,
            marginBottom: '1.5rem',
            color: gameState === GameState.WIN ? '#4ade80' : '#f87171',
            textShadow: '0 4px 3px rgba(0,0,0,0.1)'
          }}>
            {gameState === GameState.WIN ? 'YOU WON!' : 'THE WALL FELL!'}
          </h2>

          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1.5rem',
            maxWidth: '32rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderBottom: '8px solid #d1d5db',
            position: 'relative'
          }}>
            {/* AI Story Section */}
            <div style={{ marginBottom: '1.5rem', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {story ? (
                <p style={{ fontSize: '1.5rem', fontFamily: 'serif', fontStyle: 'italic', color: '#1f2937', lineHeight: 1.6 }}>
                  "{story}"
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Mystic Loader */}
                  <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '1rem' }}>
                    <div style={{
                      position: 'absolute', inset: 0, border: '4px solid #8b5cf6', borderRadius: '50%',
                      borderBottomColor: 'transparent', animation: 'spin 1.5s linear infinite'
                    }} />
                    <div style={{
                      position: 'absolute', inset: '10px', border: '4px solid #ec4899', borderRadius: '50%',
                      borderLeftColor: 'transparent', animation: 'spin 2s linear infinite reverse'
                    }} />
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      fontSize: '24px'
                    }}>✨</div>
                  </div>

                  <span style={{ fontSize: '1rem', color: '#8b5cf6', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
                    Consulting the Story Orb...
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleQuit}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  padding: '0.75rem 2rem',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 0 rgb(185,28,28)',
                  transition: 'all 0.1s',
                  cursor: 'pointer',
                  border: 'none'
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
                Quit
              </button>

              <button
                onClick={gameState === GameState.WIN ? handleContinue : startGame}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 0 rgb(30,64,175)',
                  transition: 'all 0.1s',
                  cursor: 'pointer',
                  border: 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(4px)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 0 rgb(30,64,175)';
                }}
              >
                {gameState === GameState.WIN ? 'Continue' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}