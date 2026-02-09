import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, PlayerState, Obstacle, ObstacleType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, JUMP_FORCE, GROUND_Y, INITIAL_SPEED, TOTAL_TIME, COLORS } from '../constants';
import { useGameInput } from '../utils/input';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  gameTime: number;
  setGameTime: (time: number) => void;
  setScore: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, gameTime, setGameTime, setScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const playerY = useRef(GROUND_Y);
  const playerVelocity = useRef(0);
  const playerState = useRef<PlayerState>(PlayerState.IDLE);
  const obstacles = useRef<Obstacle[]>([]);
  const frameCount = useRef(0);
  const speed = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const lastObstacleTime = useRef(0);
  const nextSpawnInterval = useRef(1.5);
  
  // Wolf Positioning & Animation Refs
  const wolfX = useRef(0); 
  const wolfY = useRef(GROUND_Y);
  const huntsmanX = useRef(GAME_WIDTH + 50);
  const gameOverTimer = useRef(0);
  const wolfJumpStartX = useRef(0);

  const bgOffset1 = useRef(0);
  const bgOffset2 = useRef(0);
  const bgOffset3 = useRef(0);

  const lastTimeRef = useRef<number>(0);
  const internalTimeRef = useRef(TOTAL_TIME);
  const lastScoreTimeRef = useRef<number>(TOTAL_TIME);

  // --- Controls ---
  const jump = useCallback(() => {
    if (playerState.current !== PlayerState.JUMPING && gameState === GameState.PLAYING) {
      playerVelocity.current = JUMP_FORCE;
      playerState.current = PlayerState.JUMPING;
    }
  }, [gameState]);

  const startSlide = useCallback(() => {
    if (gameState === GameState.PLAYING && playerState.current !== PlayerState.JUMPING) {
      playerState.current = PlayerState.SLIDING;
    }
  }, [gameState]);

  const endSlide = useCallback(() => {
    if (gameState === GameState.PLAYING && playerState.current === PlayerState.SLIDING) {
      playerState.current = PlayerState.RUNNING;
    }
  }, [gameState]);

  useGameInput(jump, startSlide, endSlide, gameState === GameState.PLAYING);

  // --- Reset ---
  useEffect(() => {
    if (gameState === GameState.START) {
      playerY.current = GROUND_Y;
      playerVelocity.current = 0;
      playerState.current = PlayerState.IDLE;
      obstacles.current = [];
      scoreRef.current = 0;
      setScore(0);
      setGameTime(TOTAL_TIME);
      
      speed.current = INITIAL_SPEED;
      wolfX.current = -120; // Increased distance (Player is at 60)
      wolfY.current = GROUND_Y;
      huntsmanX.current = GAME_WIDTH + 50;
      
      frameCount.current = 0;
      lastTimeRef.current = 0;
      internalTimeRef.current = TOTAL_TIME;
      lastScoreTimeRef.current = TOTAL_TIME;
      lastObstacleTime.current = 0;
      nextSpawnInterval.current = 1.0;
      gameOverTimer.current = 0;
    }
  }, [gameState, setScore, setGameTime]);

  // --- Helpers ---
  const spawnObstacle = () => {
    const type = Math.random() > 0.5 ? ObstacleType.ROCK : ObstacleType.BIRD;
    const w = type === ObstacleType.ROCK ? 25 : 30; 
    const h = 25;
    let y = 0;
    if (type === ObstacleType.ROCK) {
        y = GROUND_Y - h + 5; 
    } else {
        y = GROUND_Y - 45; 
    }

    obstacles.current.push({
      x: GAME_WIDTH,
      y,
      w,
      h,
      type,
      id: Date.now(),
      passed: false
    });
  };

  const checkCollision = (pRect: {x:number, y:number, w:number, h:number}, o: Obstacle) => {
    const padding = 6; 
    return (
      pRect.x + padding < o.x + o.w - padding &&
      pRect.x + pRect.w - padding > o.x + padding &&
      pRect.y + padding < o.y + o.h - padding &&
      pRect.y + pRect.h - padding > o.y + padding
    );
  };

  // --- Vector Drawing Helpers ---
  
  const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawVectorLimb = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, bendFactor: number, color: string, width: number = 4) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // Calculate control point for bend
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy / (len || 1);
    const ny = dx / (len || 1);
    
    const cx = mx + nx * bendFactor;
    const cy = my + ny * bendFactor;

    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const dt = Math.min(rawDt, 0.1);
      const timeScale = dt * 60; 

      if (gameState === GameState.PLAYING || gameState === GameState.VICTORY || gameState === GameState.GAME_OVER) {
        frameCount.current += timeScale; 
        
        if (gameState === GameState.PLAYING) {
          playerVelocity.current += GRAVITY * timeScale;
          playerY.current += playerVelocity.current * timeScale;

          if (playerY.current > GROUND_Y) {
            playerY.current = GROUND_Y;
            playerVelocity.current = 0;
            if (playerState.current === PlayerState.JUMPING) {
              playerState.current = PlayerState.RUNNING;
            }
          }

          speed.current = INITIAL_SPEED + (TOTAL_TIME - internalTimeRef.current) * 0.02;

          bgOffset1.current = (bgOffset1.current - speed.current * 0.2 * timeScale) % GAME_WIDTH;
          bgOffset2.current = (bgOffset2.current - speed.current * 0.5 * timeScale) % GAME_WIDTH;
          bgOffset3.current = (bgOffset3.current - speed.current * timeScale) % GAME_WIDTH;

          internalTimeRef.current -= dt;
          if (Math.ceil(internalTimeRef.current) < lastScoreTimeRef.current) {
             lastScoreTimeRef.current = Math.ceil(internalTimeRef.current);
             setGameTime(lastScoreTimeRef.current);
             if (lastScoreTimeRef.current <= 0) {
                setGameState(GameState.VICTORY);
             }
          }

          lastObstacleTime.current += dt;
          if (lastObstacleTime.current > nextSpawnInterval.current) {
            spawnObstacle();
            lastObstacleTime.current = 0;
            nextSpawnInterval.current = Math.random() * 3.2 + 0.8;
          }

          const playerRect = {
            x: 60,
            y: playerY.current - (playerState.current === PlayerState.SLIDING ? 20 : 40),
            w: 20,
            h: playerState.current === PlayerState.SLIDING ? 20 : 40
          };

          obstacles.current.forEach(obs => {
            obs.x -= speed.current * timeScale;
            if (checkCollision(playerRect, obs)) {
              setGameState(GameState.GAME_OVER);
              // Prepare wolf jump animation
              wolfJumpStartX.current = wolfX.current;
              gameOverTimer.current = 0;
            }
            if (!obs.passed && obs.x + obs.w < playerRect.x) {
              obs.passed = true;
              scoreRef.current += 100;
              setScore(scoreRef.current);
            }
          });
          obstacles.current = obstacles.current.filter(o => o.x + o.w > -50);
        } else if (gameState === GameState.VICTORY) {
          if (huntsmanX.current > 100) huntsmanX.current -= 1.2 * timeScale;
          if (wolfX.current > -50) wolfX.current -= 0.3 * timeScale;
          playerState.current = PlayerState.IDLE;
        } else if (gameState === GameState.GAME_OVER) {
           // Wolf Jumps logic
           gameOverTimer.current += dt;
           const jumpDuration = 0.5; // Half a second pounce
           
           if (gameOverTimer.current < jumpDuration) {
             const progress = gameOverTimer.current / jumpDuration;
             // Linear movement to player position (approx 50px)
             const targetX = 50; 
             wolfX.current = wolfJumpStartX.current + (targetX - wolfJumpStartX.current) * progress;
             
             // Parabolic Jump
             const jumpHeight = 80;
             // 4 * h * x * (1 - x) parabola
             wolfY.current = GROUND_Y - (Math.sin(progress * Math.PI) * jumpHeight);
           } else {
             // Landed on player
             wolfX.current = 50;
             wolfY.current = GROUND_Y;
           }
        }
      }

      // --- DRAWING ---
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // 1. Sky Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, COLORS.skyTop);
      gradient.addColorStop(1, COLORS.skyBottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // 2. Background Hills (Clean Curves)
      ctx.fillStyle = '#81c784'; // Lighter distant green
      ctx.beginPath();
      ctx.moveTo(0, GAME_HEIGHT);
      for(let i = 0; i <= GAME_WIDTH; i+=20) {
         const h = Math.sin((i + bgOffset1.current) * 0.015) * 30 + 60;
         ctx.lineTo(i, GAME_HEIGHT - h);
      }
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
      ctx.fill();

      // 3. Closer Trees (Vector Style)
      for(let i=0; i<6; i++) {
        const x = (bgOffset2.current + i * 140) % (GAME_WIDTH + 140);
        const treeX = x < -50 ? x + GAME_WIDTH + 140 : x;
        // Trunk
        drawRoundedRect(ctx, treeX - 4, GAME_HEIGHT - 90, 8, 90, 2, '#795548');
        // Leaves (Three circles)
        drawCircle(ctx, treeX, GAME_HEIGHT - 100, 25, COLORS.groundDark);
        drawCircle(ctx, treeX - 15, GAME_HEIGHT - 90, 20, COLORS.ground);
        drawCircle(ctx, treeX + 15, GAME_HEIGHT - 90, 20, COLORS.ground);
      }

      // 4. Ground
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      // Grass Highlights
      ctx.fillStyle = COLORS.grassHighlight;
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 4);

      // 5. Obstacles
      obstacles.current.forEach(obs => {
        // Prepare slight red outline
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.5)';
        ctx.lineWidth = 2;

        if (obs.type === ObstacleType.ROCK) {
          // Rounded Grey Rock
          ctx.beginPath();
          ctx.arc(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.rock;
          ctx.fill();
          ctx.stroke(); // Outline
          // Highlight (No outline)
          drawCircle(ctx, obs.x + obs.w/2 - 4, obs.y + obs.h/2 - 4, obs.w/4, '#90a4ae'); 
        } else {
          // Bird
          const wingY = Math.sin(frameCount.current * 0.35) * 5;
          ctx.beginPath();
          ctx.arc(obs.x + 10, obs.y + 10, 10, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.bird;
          ctx.fill();
          ctx.stroke(); // Outline
          // Wing
          ctx.beginPath();
          ctx.moveTo(obs.x + 5, obs.y + 10);
          ctx.quadraticCurveTo(obs.x + 15, obs.y - 5 + wingY, obs.x + 20, obs.y + 10 + wingY);
          ctx.lineWidth = 3;
          ctx.strokeStyle = COLORS.birdBeak;
          ctx.stroke();
          // Beak
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y+8);
          ctx.lineTo(obs.x-6, obs.y+10);
          ctx.lineTo(obs.x, obs.y+12);
          ctx.fillStyle = COLORS.birdBeak;
          ctx.fill();
        }
      });

      // 6. Little Red (Modern Vector Style)
      const px = 60;
      const py = playerY.current;
      // Increased animation speed from 0.4 to 0.5
      const t = frameCount.current * 0.5; 

      if (gameState === GameState.GAME_OVER && wolfY.current >= GROUND_Y && gameOverTimer.current > 0.5) {
        // --- GAME OVER POSE (Flattened) ---
        // Player is knocked down by the wolf
        const flatY = GROUND_Y;
        // Head
        drawCircle(ctx, px + 30, flatY - 5, 9, COLORS.skin); 
        // Hood
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(px + 30, flatY - 5, 10, 0, Math.PI * 2); 
        ctx.fill();
        // Body (Flattened)
        drawRoundedRect(ctx, px, flatY - 10, 30, 10, 5, COLORS.red);
        // Limb splat
        drawVectorLimb(ctx, px + 5, flatY - 5, px - 10, flatY - 2, 0, COLORS.redDark, 5);
      } 
      else if (playerState.current === PlayerState.SLIDING) {
        // --- SLIDING ---
        const slideBounce = Math.sin(t) * 1;
        drawCircle(ctx, px + 25, py - 15 + slideBounce, 9, COLORS.skin); // Face
        // Hood on head
        ctx.beginPath();
        ctx.arc(px + 25, py - 15 + slideBounce, 10, Math.PI, 0); 
        ctx.fillStyle = COLORS.red;
        ctx.fill();
        // Body (Prone)
        drawRoundedRect(ctx, px, py - 20 + slideBounce, 28, 14, 6, COLORS.red);
        // Arms forward
        drawVectorLimb(ctx, px + 15, py - 12 + slideBounce, px + 40, py - 5 + slideBounce, -5, COLORS.redDark, 5);
        drawCircle(ctx, px + 40, py - 5 + slideBounce, 3.5, COLORS.skin); 
        // Legs dragging
        drawVectorLimb(ctx, px + 2, py - 10 + slideBounce, px - 12, py - 5, 2, COLORS.redDark, 5);
      } else {
        // --- RUNNING / JUMPING ---
        const bounce = playerState.current === PlayerState.RUNNING ? Math.abs(Math.sin(t)) * 3 : 0;
        const centerX = px + 10;
        const shoulderY = py - 30 - bounce;
        const hipY = py - 10 - bounce;
        
        const rightLegPhase = Math.sin(t + Math.PI);
        const leftLegPhase = Math.sin(t);
        const armSwingRange = 15;

        // Back Arm (Left)
        const leftArmAngle = rightLegPhase;
        const laX = centerX + leftArmAngle * armSwingRange;
        const laY = shoulderY + 12 - Math.abs(leftArmAngle) * 3;
        drawVectorLimb(ctx, centerX - 3, shoulderY, laX, laY, leftArmAngle > 0 ? -8 : 8, COLORS.redDark, 5);
        drawCircle(ctx, laX, laY, 3.5, COLORS.skin);

        // Legs
        if (playerState.current === PlayerState.JUMPING) {
          drawVectorLimb(ctx, centerX, hipY, centerX - 10, hipY + 10, 5, COLORS.redDark, 5);
          drawVectorLimb(ctx, centerX, hipY, centerX + 10, hipY + 5, -5, COLORS.redDark, 5);
        } else {
          // Running Left Leg
          const lStride = leftLegPhase * 12;
          const lLift = leftLegPhase > 0 ? Math.sin(t) * 8 : 0;
          const lx = centerX + lStride;
          const ly = py - lLift;
          drawVectorLimb(ctx, centerX, hipY, lx, ly, leftLegPhase > 0 ? -6 : 3, COLORS.redDark, 5);
        }

        // Body
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        const topY = shoulderY - 5;
        ctx.moveTo(centerX - 4, topY); 
        ctx.lineTo(centerX + 4, topY);
        ctx.lineTo(centerX + 10, py - 10 - bounce); 
        ctx.lineTo(centerX - 10, py - 10 - bounce);
        ctx.fill();

        // Head
        drawCircle(ctx, centerX, topY - 8, 10, COLORS.skin);
        // Hood
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(centerX, topY - 10, 11, Math.PI, 0); 
        ctx.lineTo(centerX + 11, topY - 5);
        ctx.lineTo(centerX - 11, topY - 5);
        ctx.fill();
        drawCircle(ctx, centerX, topY - 4, 3, COLORS.redDark);

        // Right Leg
        if (playerState.current !== PlayerState.JUMPING) {
           const rStride = rightLegPhase * 12;
           const rLift = rightLegPhase > 0 ? Math.sin(t + Math.PI) * 8 : 0;
           const rx = centerX + rStride;
           const ry = py - rLift;
           drawVectorLimb(ctx, centerX, hipY, rx, ry, rightLegPhase > 0 ? -6 : 3, COLORS.redDark, 5);
        }

        // Front Arm
        const rightArmAngle = leftLegPhase;
        const raX = centerX + rightArmAngle * armSwingRange;
        const raY = shoulderY + 12 - Math.abs(rightArmAngle) * 3;
        drawVectorLimb(ctx, centerX + 3, shoulderY, raX, raY, rightArmAngle > 0 ? -8 : 8, COLORS.redDark, 5);
        drawCircle(ctx, raX, raY, 3.5, COLORS.skin);
      }

      // 7. Wolf (Vector)
      const wx = wolfX.current;
      const wy = wolfY.current; // Use dynamic Y for jump
      const isWolfJumping = wy < GROUND_Y - 5;
      const wBounce = isWolfJumping ? 0 : Math.abs(Math.sin(frameCount.current * 0.35)) * 4; // Faster wolf bounce
      
      // Body
      drawRoundedRect(ctx, wx, wy - 35 - wBounce, 45, 25, 8, COLORS.wolf);
      // Head
      drawRoundedRect(ctx, wx + 35, wy - 45 - wBounce, 25, 25, 6, COLORS.wolf);
      // Snout
      drawRoundedRect(ctx, wx + 55, wy - 35 - wBounce, 10, 10, 2, COLORS.wolfDark);
      // Eye
      drawCircle(ctx, wx + 45, wy - 38 - wBounce, 3, COLORS.wolfEye);
      // Ear
      ctx.beginPath();
      ctx.moveTo(wx + 40, wy - 45 - wBounce);
      ctx.lineTo(wx + 45, wy - 55 - wBounce);
      ctx.lineTo(wx + 50, wy - 45 - wBounce);
      ctx.fillStyle = COLORS.wolf;
      ctx.fill();

      // Legs
      if (isWolfJumping) {
         // Leap pose (legs stretched)
         drawVectorLimb(ctx, wx + 10, wy - 20, wx - 10, wy, 0, COLORS.wolfDark, 5); // Back leg back
         drawVectorLimb(ctx, wx + 35, wy - 20, wx + 55, wy + 10, 0, COLORS.wolfDark, 5); // Front leg fwd
      } else {
         const wLeg = Math.sin(frameCount.current * 0.5) * 10; // Faster wolf legs
         drawVectorLimb(ctx, wx + 10, wy - 15, wx + 5 + wLeg, wy, -2, COLORS.wolfDark, 5);
         drawVectorLimb(ctx, wx + 35, wy - 15, wx + 35 - wLeg, wy, 2, COLORS.wolfDark, 5);
      }

      if (gameState === GameState.VICTORY) {
         const hx = huntsmanX.current;
         const hy = GROUND_Y;
         drawRoundedRect(ctx, hx, hy - 40, 20, 40, 4, '#5d4037'); // Clothes
         drawCircle(ctx, hx + 10, hy - 45, 10, COLORS.skin);
         drawRoundedRect(ctx, hx - 2, hy - 55, 24, 10, 2, '#2e7d32'); // Hat
         drawVectorLimb(ctx, hx + 5, hy - 25, hx - 10, hy - 20, 0, '#5d4037', 5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, setGameState, setScore, setGameTime]); 

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full h-full object-contain"
    />
  );
};

export default GameCanvas;