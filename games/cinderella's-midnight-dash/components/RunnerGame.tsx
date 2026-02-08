import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Entity, EntityType, Particle } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_FORCE, RUN_SPEED, 
  GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SLIDE_HEIGHT,
  GUARD_CATCH_SPEED, GAME_DURATION_MS, OBSTACLE_SPAWN_RATE_MIN, OBSTACLE_SPAWN_RATE_MAX
} from '../constants';
import { drawBackground, drawCinderella, drawGuard, drawObstacle, drawChariot } from './PixelSprites';
import { getFairyGodmotherMessage } from '../services/geminiService';

const RunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React state for UI overlays
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
  const [godmotherMessage, setGodmotherMessage] = useState<string>("");

  // Refs for game engine state
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const playerRef = useRef<Entity>({ id: 0, type: EntityType.PLAYER, x: 150, y: GROUND_Y - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, vx: 0, vy: 0 });
  const guardRef = useRef<Entity>({ id: 1, type: EntityType.GUARD, x: -50, y: GROUND_Y - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT });
  const obstaclesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const isSlidingRef = useRef<boolean>(false);
  const isJumpingRef = useRef<boolean>(false);
  const bgScrollRef = useRef<number>(0);
  
  // Input Handling Refs
  const inputStartTimeRef = useRef<number>(0);
  const midGameTriggeredRef = useRef<boolean>(false);
  
  // Optimization
  const lastSecondRef = useRef<number>(GAME_DURATION_MS / 1000);

  // Initialize Game
  const startGame = async () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setTimeLeft(GAME_DURATION_MS / 1000);
    lastSecondRef.current = GAME_DURATION_MS / 1000;
    setGodmotherMessage("Loading magic...");

    // Reset Entities
    playerRef.current = { id: 0, type: EntityType.PLAYER, x: 150, y: GROUND_Y - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, vx: 0, vy: 0 };
    guardRef.current = { id: 1, type: EntityType.GUARD, x: 20, y: GROUND_Y - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
    obstaclesRef.current = [];
    particlesRef.current = [];
    gameTimeRef.current = 0;
    lastSpawnTimeRef.current = 0;
    isSlidingRef.current = false;
    isJumpingRef.current = false;
    bgScrollRef.current = 0;
    inputStartTimeRef.current = 0;
    midGameTriggeredRef.current = false;

    // Start Loop
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);

    // Fetch AI Message
    const msg = await getFairyGodmotherMessage('start');
    setGodmotherMessage(msg);
  };

  // --- Logic Actions ---

  const performJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    // Check if on ground or sliding (jump cancels slide)
    const onGround = playerRef.current.y >= GROUND_Y - PLAYER_HEIGHT - 5;
    const isSliding = isSlidingRef.current;

    if (onGround || isSliding) {
       // Cancel slide if active
       if (isSliding) {
           isSlidingRef.current = false;
           playerRef.current.h = PLAYER_HEIGHT;
           playerRef.current.y = GROUND_Y - PLAYER_HEIGHT;
       }

       playerRef.current.vy = JUMP_FORCE;
       isJumpingRef.current = true;
       
       // Jump Particles
       for(let i=0; i<5; i++) {
         particlesRef.current.push({
           x: playerRef.current.x + PLAYER_WIDTH/2,
           y: playerRef.current.y + PLAYER_HEIGHT,
           vx: (Math.random() - 0.5) * 4,
           vy: (Math.random() - 0.5) * 4,
           life: 1.0,
           color: '#fff',
           size: 3
         });
       }
    }
  }, [gameState]);

  const performSlideStart = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    // Can only slide if on ground and not jumping
    if (playerRef.current.y >= GROUND_Y - PLAYER_HEIGHT - 5 && !isJumpingRef.current) { 
      isSlidingRef.current = true;
      playerRef.current.h = PLAYER_SLIDE_HEIGHT;
      playerRef.current.y = GROUND_Y - PLAYER_SLIDE_HEIGHT;
    }
  }, [gameState]);

  const performSlideEnd = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    if (isSlidingRef.current) {
        isSlidingRef.current = false;
        playerRef.current.h = PLAYER_HEIGHT;
        if (playerRef.current.y >= GROUND_Y - PLAYER_SLIDE_HEIGHT - 5) {
            playerRef.current.y = GROUND_Y - PLAYER_HEIGHT;
        }
    }
  }, [gameState]);

  // --- Input Handlers (Unified) ---

  const handleInputStart = (e: React.SyntheticEvent | Event) => {
    // Check if target is a button (e.g. Try Again), if so let it pass
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    // Prevent default to stop scrolling/selection
    if (e.type !== 'mousedown') { // Allow default on mousedown for focus sometimes, but usually prevent
         e.preventDefault(); 
    }
    
    if (gameState !== GameState.PLAYING) return;

    inputStartTimeRef.current = performance.now();
    performSlideStart();
  };

  const handleInputEnd = (e: React.SyntheticEvent | Event) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    
    if (gameState !== GameState.PLAYING) return;

    const duration = performance.now() - inputStartTimeRef.current;
    performSlideEnd(); // Always stop sliding

    // If tap was short (< 200ms), Trigger Jump
    if (duration < 200) {
      performJump();
    }
  };

  // Keyboard Listeners (Keep separate for desktop precision)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        performJump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        performSlideStart();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      if (e.code === 'ArrowDown') {
        e.preventDefault();
        performSlideEnd();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, performJump, performSlideStart, performSlideEnd]);

  // Helper to check collisions
  const checkCollision = (r1: Entity, r2: Entity) => {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  const endGame = async (won: boolean) => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setGameState(won ? GameState.WON : GameState.LOST);
    
    setGodmotherMessage("Consulting the stars...");
    const msg = await getFairyGodmotherMessage(won ? 'win' : 'lose');
    setGodmotherMessage(msg);
  };

  const gameLoop = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // 1. Update State
    gameTimeRef.current += deltaTime;
    bgScrollRef.current += RUN_SPEED;

    // Check Win Time
    if (gameTimeRef.current >= GAME_DURATION_MS) {
       const hasChariot = obstaclesRef.current.find(o => o.type === EntityType.CHARIOT);
       if (!hasChariot) {
         obstaclesRef.current.push({
           id: 9999,
           type: EntityType.CHARIOT,
           x: CANVAS_WIDTH + 100,
           y: GROUND_Y - 120,
           w: 120,
           h: 120
         });
       }
    }
    
    // Check Midgame Trigger (30 seconds)
    if (!midGameTriggeredRef.current && gameTimeRef.current > 30000) {
      midGameTriggeredRef.current = true;
      getFairyGodmotherMessage('midgame').then(msg => {
        // Only update if we are still playing
        if (gameTimeRef.current < GAME_DURATION_MS) {
            setGodmotherMessage(msg);
        }
      });
    }

    // Update Player Physics
    const p = playerRef.current;
    
    // Apply Gravity
    if (p.y < GROUND_Y - p.h || p.vy !== 0) {
      p.vy = (p.vy || 0) + GRAVITY;
      p.y += p.vy;
    }

    // Ground Collision
    if (p.y >= GROUND_Y - p.h) {
      p.y = GROUND_Y - p.h;
      p.vy = 0;
      isJumpingRef.current = false;
    }
    
    // Validate Sliding Height (Ensure physics match state)
    if (isSlidingRef.current) {
        if (p.y >= GROUND_Y - PLAYER_HEIGHT) { 
            p.h = PLAYER_SLIDE_HEIGHT;
            p.y = GROUND_Y - PLAYER_SLIDE_HEIGHT;
        }
    } else {
        p.h = PLAYER_HEIGHT;
        if (p.y > GROUND_Y - PLAYER_HEIGHT) p.y = GROUND_Y - PLAYER_HEIGHT;
    }

    // Update Guard
    const g = guardRef.current;
    if (g.x > 20) {
      g.x -= 0.5;
    }
    
    // Spawner
    if (gameTimeRef.current < GAME_DURATION_MS && time - lastSpawnTimeRef.current > (Math.random() * (OBSTACLE_SPAWN_RATE_MAX - OBSTACLE_SPAWN_RATE_MIN) + OBSTACLE_SPAWN_RATE_MIN)) {
       lastSpawnTimeRef.current = time;
       const isHigh = Math.random() > 0.5;
       const obsHeight = isHigh ? 60 : 50;
       const obsWidth = 50;
       const obsY = isHigh ? GROUND_Y - 140 : GROUND_Y - 50;
       
       obstaclesRef.current.push({
         id: Date.now(),
         type: isHigh ? EntityType.OBSTACLE_HIGH : EntityType.OBSTACLE_LOW,
         x: CANVAS_WIDTH + 50,
         y: obsY,
         w: obsWidth,
         h: obsHeight
       });
    }

    // Move Obstacles
    const remainingObstacles: Entity[] = [];
    obstaclesRef.current.forEach(obs => {
      obs.x -= RUN_SPEED;
      
      if (checkCollision(p, obs)) {
        if (obs.type === EntityType.CHARIOT) {
          endGame(true);
          return;
        } else {
           g.x += 100; // Stumble penalty
        }
      } else {
        if (!obs.passed && obs.x + obs.w < p.x) {
          obs.passed = true;
          setScore(s => s + 100);
        }
        
        if (obs.x + obs.w > -100) {
          remainingObstacles.push(obs);
        }
      }
    });
    obstaclesRef.current = remainingObstacles;

    // Check Guard Catch
    if (g.x + g.w > p.x + 20) {
      endGame(false);
      return;
    }

    // Update Timer UI
    const currentRemainingSeconds = Math.ceil((GAME_DURATION_MS - gameTimeRef.current) / 1000);
    if (currentRemainingSeconds !== lastSecondRef.current) {
        lastSecondRef.current = currentRemainingSeconds;
        setTimeLeft(Math.max(0, currentRemainingSeconds));
    }

    // 2. Draw
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, bgScrollRef.current);
    
    obstaclesRef.current.forEach(obs => {
      if (obs.type === EntityType.CHARIOT) drawChariot(ctx, obs);
      else drawObstacle(ctx, obs);
    });

    drawCinderella(ctx, p, isSlidingRef.current, gameTimeRef.current / 20);
    drawGuard(ctx, g, gameTimeRef.current / 20);

    // Draw Particles
    particlesRef.current.forEach((pt, i) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.05;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.globalAlpha = 1.0;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none"
         onMouseDown={handleInputStart}
         onMouseUp={handleInputEnd}
         onMouseLeave={handleInputEnd}
         onTouchStart={handleInputStart}
         onTouchEnd={handleInputEnd}
         onTouchCancel={handleInputEnd}
         onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* Game HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-4 left-0 w-full px-8 flex justify-between text-white font-bold text-lg z-10 pointer-events-none drop-shadow-md">
          <div>SCORE: {score}</div>
          <div className={`${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            TIME: {Math.ceil(timeLeft)}s
          </div>
        </div>
      )}

      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full object-contain bg-black pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Controls Hint */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-8 w-full text-center text-white/40 pointer-events-none text-sm animate-pulse">
          TAP TO JUMP • HOLD TO SLIDE
        </div>
      )}

      {/* Menu / Game Over Overlays */}
      {gameState !== GameState.PLAYING && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-30 p-8 text-center"
             // Stop propagation to prevent game start clicks from registering as game input immediately
             onMouseDown={(e) => e.stopPropagation()}
             onTouchStart={(e) => e.stopPropagation()}
        >
          
          <h2 className={`text-4xl mb-6 ${gameState === GameState.WON ? 'text-yellow-400' : 'text-blue-400'}`}>
            {gameState === GameState.MENU ? "CINDERELLA'S ESCAPE" : 
             gameState === GameState.WON ? "YOU ESCAPED!" : "CAUGHT!"}
          </h2>

          {gameState === GameState.LOST && <p className="mb-4 text-red-400">The Royal Guard caught you!</p>}
          {gameState === GameState.WON && <p className="mb-4 text-green-400">You reached the chariot in time!</p>}

          <div className="bg-gray-800 border-2 border-purple-500 p-4 rounded-lg max-w-md mb-8 relative">
            <div className="absolute -top-3 -left-3 text-2xl">🧚‍♀️</div>
            <p className="text-sm italic text-purple-200 min-h-[3em]">
              "{godmotherMessage || "..."}"
            </p>
          </div>

          <button 
            onClick={startGame}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded shadow-[0_4px_0_rgb(180,83,9)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider"
          >
            {gameState === GameState.MENU ? "Start Running" : "Try Again"}
          </button>

          <div className="mt-8 text-xs text-gray-500">
            TAP / CLICK TO JUMP • HOLD TO SLIDE
          </div>
        </div>
      )}
    </div>
  );
};

export default RunnerGame;