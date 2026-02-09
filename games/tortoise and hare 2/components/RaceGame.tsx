import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ROAD_WIDTH_PCT, FPS, BASE_SPEED, BOOST_SPEED, BOOST_DURATION_MS,
  FINISH_LINE_Z, HARE_START_Z, HARE_BASE_SPEED, HARE_MIN_SPEED, HARE_DECAY_RATE,
  CAMERA_OFFSET_Y, RENDER_DISTANCE, LANE_SPEED
} from '../constants';
import { PowerUp, Particle, CrowdMember } from '../types';
import { Zap, Flag } from 'lucide-react';

interface RaceGameProps {
  onGameOver: (won: boolean) => void;
}

const RaceGame: React.FC<RaceGameProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  // Input State
  const inputRef = useRef({ left: false, right: false });

  // Game State Refs (Mutable for loop performance)
  const state = useRef({
    playerX: 50, // 0-100 Center
    playerZ: 0,
    playerSpeed: BASE_SPEED,
    boostEndTime: 0,
    hareZ: HARE_START_Z,
    hareSpeed: HARE_BASE_SPEED,
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    crowd: [] as CrowdMember[],
    startTime: Date.now(),
    finishTime: 0, // 0 if racing, timestamp if crossed line
    didWin: false,
    gameOverTriggered: false // To ensure we only call onGameOver once
  });

  // UI State (Synced less frequently)
  const [hudState, setHudState] = useState({
    distance: 0,
    hareDistance: HARE_START_Z,
    boostActive: false,
    showResult: null as null | 'WIN' | 'LOSE'
  });

  // Initialize Game Objects
  useEffect(() => {
    const s = state.current;

    // Generate static powerups
    const powerUps: PowerUp[] = [];
    for (let z = 1000; z < FINISH_LINE_Z; z += 800) {
      powerUps.push({
        id: `p-${z}`,
        type: 'SPEED',
        x: 20 + Math.random() * 60,
        z: z + (Math.random() * 400 - 200),
        width: 10,
        height: 10,
        active: true
      });
    }
    s.powerUps = powerUps;

    // Generate Crowd
    const crowd: CrowdMember[] = [];
    // More dense near finish line
    for (let z = 200; z < FINISH_LINE_Z + 1500; z += 300) {
      const isNearFinish = z > FINISH_LINE_Z - 2000;
      const density = isNearFinish ? 3 : 1; // More fans near finish

      for (let i = 0; i < density; i++) {
        // Left side (-30 to -10)
        crowd.push({
          x: -10 - Math.random() * 20,
          z: z + Math.random() * 100,
          color: ['#d97706', '#9ca3af', '#fca5a5'][Math.floor(Math.random() * 3)], // Fox, Wolf, Pinkish
          type: 'bear', // Placeholder for shape logic
          jumpOffset: Math.random() * Math.PI * 2
        });
        // Right side (110 to 130)
        crowd.push({
          x: 110 + Math.random() * 20,
          z: z + Math.random() * 100,
          color: ['#d97706', '#9ca3af', '#fca5a5'][Math.floor(Math.random() * 3)],
          type: 'bear',
          jumpOffset: Math.random() * Math.PI * 2
        });
      }
    }
    s.crowd = crowd;

  }, []);

  const handleInputStart = (direction: 'left' | 'right') => {
    if (state.current.finishTime > 0) return; // Disable input after finish
    if (direction === 'left') inputRef.current.left = true;
    if (direction === 'right') inputRef.current.right = true;
  };

  const handleInputEnd = (direction: 'left' | 'right') => {
    if (direction === 'left') inputRef.current.left = false;
    if (direction === 'right') inputRef.current.right = false;
  };

  const spawnParticles = (x: number, y: number, count: number, color: string, gravity = 0) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2,
        gravity
      });
    }
  };

  const spawnConfetti = (width: number, height: number) => {
    for (let i = 0; i < 50; i++) {
      state.current.particles.push({
        x: Math.random() * width,
        y: -50 - Math.random() * 100, // Start above screen
        vx: (Math.random() - 0.5) * 5,
        vy: 5 + Math.random() * 5, // Fall down
        life: 2.0, // Last longer
        color: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7'][Math.floor(Math.random() * 5)],
        size: 6 + Math.random() * 4,
        gravity: 0.1
      });
    }
  };

  const update = useCallback(() => {
    const s = state.current;
    if (s.gameOverTriggered) return;

    const now = Date.now();

    // --- Race Ending Logic ---
    if (s.finishTime === 0) {
      // Normal Race Logic

      // Player Movement
      if (inputRef.current.left) s.playerX = Math.max(10, s.playerX - LANE_SPEED);
      if (inputRef.current.right) s.playerX = Math.min(90, s.playerX + LANE_SPEED);

      // Speed / Boost
      const isBoosted = now < s.boostEndTime;
      const currentTargetSpeed = isBoosted ? BOOST_SPEED : BASE_SPEED;
      s.playerSpeed += (currentTargetSpeed - s.playerSpeed) * 0.1;
      s.playerZ += s.playerSpeed;

      // Hare Logic
      s.hareSpeed = Math.max(HARE_MIN_SPEED, s.hareSpeed - HARE_DECAY_RATE);
      s.hareZ += s.hareSpeed;

      // Collision Check (Powerups)
      s.powerUps.forEach(p => {
        if (!p.active) return;
        if (Math.abs(p.z - s.playerZ) < 60 && Math.abs(p.x - s.playerX) < 15) {
          p.active = false;
          s.boostEndTime = now + BOOST_DURATION_MS;
          spawnParticles(window.innerWidth / 2, window.innerHeight * CAMERA_OFFSET_Y, 20, '#facc15');
        }
      });

      // Check for finish
      if (s.playerZ >= FINISH_LINE_Z) {
        s.finishTime = now;
        s.didWin = true;
        // Immediate confetti burst
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 50, '#FFD700', 0.2);
      } else if (s.hareZ >= FINISH_LINE_Z) {
        s.finishTime = now;
        s.didWin = false;
      }

    } else {
      // Post-Race Sequence (Animation for 3 seconds)
      const timeSinceFinish = now - s.finishTime;

      // Slow down player gracefully
      s.playerSpeed *= 0.95;
      s.playerZ += s.playerSpeed;

      // Hare continues or slows down
      s.hareSpeed *= 0.95;
      s.hareZ += s.hareSpeed;

      // Win Effects
      if (s.didWin && timeSinceFinish < 2500 && Math.random() > 0.8) {
        spawnConfetti(window.innerWidth, window.innerHeight);
      }

      // Trigger Game Over Callback after 3s
      if (timeSinceFinish > 3000 && !s.gameOverTriggered) {
        s.gameOverTriggered = true;
        onGameOver(s.didWin);
      }
    }

    // --- Particles Update ---
    s.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.life -= p.gravity ? 0.01 : 0.06; // Confetti fades slower
    });
    s.particles = s.particles.filter(p => p.life > 0);

    // --- Sync HUD ---
    setHudState({
      distance: s.playerZ,
      hareDistance: s.hareZ,
      boostActive: now < s.boostEndTime,
      showResult: s.finishTime > 0 ? (s.didWin ? 'WIN' : 'LOSE') : null
    });

  }, [onGameOver]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const s = state.current;
    const now = Date.now();

    // Clear
    ctx.clearRect(0, 0, width, height);

    // --- Draw Road ---
    const roadW = width * (ROAD_WIDTH_PCT / 100);
    const roadX = (width - roadW) / 2;

    // Grass
    ctx.fillStyle = '#064e3b'; // emerald-900
    ctx.fillRect(0, 0, width, height);

    // Road Body
    ctx.fillStyle = '#52525b';
    ctx.fillRect(roadX, 0, roadW, height);

    // Coordinate Helpers
    const getScreenY = (objZ: number) => {
      const relZ = objZ - s.playerZ;
      const playerScreenY = height * CAMERA_OFFSET_Y;
      return playerScreenY - relZ;
    };
    const getScreenX = (objX: number) => {
      return roadX + (objX / 100) * roadW;
    };

    // --- Draw Crowd ---
    const bounceSpeed = s.finishTime > 0 && s.didWin ? 0.015 : 0.008; // Jump fast if win
    const shouldJump = !(s.finishTime > 0 && !s.didWin); // Stop jumping if lost

    s.crowd.forEach(member => {
      const screenY = getScreenY(member.z);
      // Only draw if visible
      if (screenY > -50 && screenY < height + 50) {
        const screenX = getScreenX(member.x);

        let yOffset = 0;
        if (shouldJump) {
          yOffset = Math.abs(Math.sin(now * bounceSpeed + member.jumpOffset)) * 15;
        }

        ctx.save();
        ctx.translate(screenX, screenY - yOffset);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15 + yOffset, 10, 4, 0, 0, Math.PI * 2); // Shadow stays on ground
        ctx.fill();

        // Body
        ctx.fillStyle = member.color;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.arc(-8, -8, 5, 0, Math.PI * 2);
        ctx.arc(8, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Face (Eyes)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -2, 1, 0, Math.PI * 2);
        ctx.arc(4, -2, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });

    // --- Road Details ---
    const stripeHeight = 60;
    const offsetY = s.playerZ % (stripeHeight * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(roadX, 0, roadW, height);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -s.playerZ;
    ctx.beginPath();
    ctx.moveTo(width / 2, -100);
    ctx.lineTo(width / 2, height + 100);
    ctx.stroke();

    for (let y = -offsetY - stripeHeight; y < height; y += stripeHeight) {
      const isRed = Math.floor((s.playerZ + y) / stripeHeight) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
      ctx.fillRect(roadX - 10, y, 10, stripeHeight);
      ctx.fillRect(roadX + roadW, y, 10, stripeHeight);
    }
    ctx.restore();

    // --- Draw Finish Line ---
    const finishY = getScreenY(FINISH_LINE_Z);
    if (finishY > -100 && finishY < height + 100) {
      // Checkerboard
      const checkSize = 20;
      for (let cx = roadX; cx < roadX + roadW; cx += checkSize) {
        for (let cy = 0; cy < 3; cy++) {
          ctx.fillStyle = ((cx / checkSize + cy) % 2 === 0) ? '#000' : '#fff';
          ctx.fillRect(cx, finishY - (cy * checkSize), checkSize, checkSize);
        }
      }

      // Posts
      ctx.fillStyle = '#b45309';
      ctx.fillRect(roadX - 15, finishY - 150, 15, 150);
      ctx.fillRect(roadX + roadW, finishY - 150, 15, 150);

      // Banner
      ctx.fillStyle = '#fde047'; // yellow banner
      ctx.fillRect(roadX, finishY - 140, roadW, 40);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("FINISH", width / 2, finishY - 110);
    }

    // --- Draw Powerups ---
    s.powerUps.forEach(p => {
      if (!p.active) return;
      const py = getScreenY(p.z);
      if (py > -50 && py < height + 50) {
        const px = getScreenX(p.x);

        ctx.save();
        ctx.translate(px, py);
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 15;

        // Pepper
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 8, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.quadraticCurveTo(-12, -12, -10, -15);
        ctx.stroke();
        ctx.restore();
      }
    });

    // --- Draw Hare ---
    const hareScreenY = getScreenY(s.hareZ);
    if (hareScreenY > -100 && hareScreenY < height + 100) {
      const hareXOffset = Math.sin(s.hareZ * 0.01) * 20;
      const hx = getScreenX(50 + hareXOffset);

      ctx.save();
      ctx.translate(hx, hareScreenY);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 20, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = '#a8a29e';
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 2;

      // Ears
      ctx.beginPath();
      ctx.ellipse(-8, -20, 6, 15, -0.2, 0, Math.PI * 2);
      ctx.ellipse(8, -20, 6, 15, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (s.hareSpeed < HARE_BASE_SPEED * 0.6) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(15, -15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Draw Player (Tortoise) ---
    const playerScreenY = height * CAMERA_OFFSET_Y;
    const playerScreenX = getScreenX(s.playerX);

    ctx.save();
    ctx.translate(playerScreenX, playerScreenY);

    // Boost effect
    if (s.boostEndTime > Date.now() && s.finishTime === 0) {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-10, 25);
      ctx.lineTo(0, 50 + Math.random() * 20);
      ctx.lineTo(10, 25);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 25, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    // Animate legs if moving
    const legOffset = s.playerSpeed > 1 ? Math.sin(now * 0.02) * 5 : 0;
    ctx.arc(-18, -10 + legOffset, 8, 0, Math.PI * 2);
    ctx.arc(18, -10 - legOffset, 8, 0, Math.PI * 2);
    ctx.arc(-18, 15 - legOffset, 8, 0, Math.PI * 2);
    ctx.arc(18, 15 + legOffset, 8, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -25, 12, 0, Math.PI * 2);
    ctx.fill();

    // Shell
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pattern
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- Draw Particles (including Confetti) ---
    s.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life > 1 ? 1 : p.life;

      if (p.gravity) {
        // Confetti rect
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(now * 0.01 + p.vx); // Rotate confetti
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        // Standard round particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    // --- Win/Lose Overlay Text in World? No, Screen overlay is drawn by React or Canvas ---
    // Let's draw it in Canvas for perfect sync with animation
    if (s.finishTime > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, height / 2 - 60, width, 120);

      ctx.font = '900 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (s.didWin) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText("YOU WON!", width / 2, height / 2);

        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText("AMAZING SPEED!", width / 2, height / 2 + 45);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText("FINISHED", width / 2, height / 2);

        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText("Maybe next time...", width / 2, height / 2 + 45);
      }
      ctx.restore();
    }

    // --- Speed Lines ---
    if (s.playerSpeed > BASE_SPEED * 1.2 && s.finishTime === 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lx = Math.random() * width;
        const ly = Math.random() * height;
        const lLen = 50 + Math.random() * 100;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + lLen);
        ctx.stroke();
      }
    }

  }, []);

  // Loop Setup
  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };

    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update, draw]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') handleInputStart('left');
      if (e.key === 'ArrowRight' || e.key === 'd') handleInputStart('right');
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') handleInputEnd('left');
      if (e.key === 'ArrowRight' || e.key === 'd') handleInputEnd('right');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: 'black' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Touch Controls Layer */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 20 }}>
        <div
          style={{ width: '50%', height: '100%', cursor: 'pointer' }}
          onTouchStart={() => handleInputStart('left')}
          onTouchEnd={() => handleInputEnd('left')}
          onMouseDown={() => handleInputStart('left')}
          onMouseUp={() => handleInputEnd('left')}
          onMouseLeave={() => handleInputEnd('left')}
        />
        <div
          style={{ width: '50%', height: '100%', cursor: 'pointer' }}
          onTouchStart={() => handleInputStart('right')}
          onTouchEnd={() => handleInputEnd('right')}
          onMouseDown={() => handleInputStart('right')}
          onMouseUp={() => handleInputEnd('right')}
          onMouseLeave={() => handleInputEnd('right')}
        />
      </div>

      {/* HUD Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: '1rem',
        zIndex: 30,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'opacity 0.5s',
        opacity: hudState.showResult ? 0 : 1
      }}>
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          maxWidth: '32rem',
          margin: '0 auto',
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(4px)',
          borderRadius: '9999px',
          height: '2rem',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Finish Line Marker */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '1rem',
            backgroundColor: '#facc15', // yellow-400
            zIndex: 10,
            borderLeft: '1px solid rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flag size={12} color="#713f12" fill="currentColor" />
          </div>

          {/* Hare Icon */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'all 0.3s',
              left: `${Math.min(95, (hudState.hareDistance / FINISH_LINE_Z) * 100)}%`
            }}
          >
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#78716c', // stone-500
              borderRadius: '9999px',
              border: '2px solid white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              marginLeft: '-0.75rem'
            }}>
              🐰
            </div>
          </div>

          {/* Turtle Icon */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              transition: 'all 0.075s',
              left: `${Math.min(95, (hudState.distance / FINISH_LINE_Z) * 100)}%`
            }}
          >
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#10b981', // emerald-500
              borderRadius: '9999px',
              border: '2px solid white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              marginLeft: '-0.75rem',
              zIndex: 20
            }}>
              🐢
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '32rem',
          margin: '0 auto',
          width: '100%',
          color: 'white',
          fontWeight: 'bold',
          filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            transition: 'background-color 0.15s',
            backgroundColor: hudState.boostActive ? '#eab308' : 'rgba(0, 0, 0, 0.4)',
            color: hudState.boostActive ? '#713f12' : 'white'
          }}>
            <Zap size={24} fill={hudState.boostActive ? "currentColor" : "none"} />
            <span style={{ fontSize: '1.25rem' }}>{hudState.boostActive ? "BOOST!" : "NORMAL"}</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>DISTANCE</div>
            <div style={{ fontSize: '1.25rem', fontFamily: 'monospace' }}>{Math.floor(Math.max(0, FINISH_LINE_Z - hudState.distance))}m</div>
          </div>
        </div>
      </div>

      {/* Control Hints (Hidden when finished) */}
      {!hudState.showResult && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: 0,
          width: '100%',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          opacity: 0.5,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>
          <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>← LEFT</span>
          <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>RIGHT →</span>
        </div>
      )}
    </div>
  );
};

export default RaceGame;