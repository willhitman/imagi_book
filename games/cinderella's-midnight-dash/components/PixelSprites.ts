import { COLORS } from '../constants';
import { Entity, EntityType } from '../types';

// Helper to draw a pixel rect
const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, scrollX: number) => {
  // 1. Wall Background (Castle Interior)
  ctx.fillStyle = '#2d3748'; // Dark stone
  ctx.fillRect(0, 0, width, height);

  // Pillars / Windows parallax
  const pillarWidth = 100;
  const pillarSpacing = 400;
  const totalOffset = scrollX * 0.5; // Parallax factor
  
  for (let x = - (totalOffset % pillarSpacing) - pillarWidth; x < width; x += pillarSpacing) {
    // Draw Pillar
    drawRect(ctx, x, 50, pillarWidth, height - 50, '#4a5568');
    // Draw Window in between
    drawRect(ctx, x + 150, 100, 80, 150, '#1a202c'); // Window void
    drawRect(ctx, x + 150, 100, 80, 150, 'rgba(0,0,0,0.5)'); // Window bars?
    // Moon in window
    ctx.fillStyle = '#fefcbf';
    ctx.beginPath();
    ctx.arc(x + 190, 140, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Floor
  const floorY = 380;
  drawRect(ctx, 0, floorY, width, height - floorY, COLORS.floor);

  // 3. Red Carpet
  // Carpet Perspective (Pseudo-3D effect not strictly necessary for 2D runner, but let's just do a flat carpet)
  drawRect(ctx, 0, floorY + 10, width, height - floorY - 20, COLORS.carpet);
  
  // Carpet Gold Trim
  const carpetOffset = scrollX * 1; 
  const trimSpacing = 100;
  for (let x = - (carpetOffset % trimSpacing); x < width; x += trimSpacing) {
    drawRect(ctx, x, floorY + 10, 10, 5, '#ecc94b');
    drawRect(ctx, x, height - 15, 10, 5, '#ecc94b');
  }
};

export const drawCinderella = (ctx: CanvasRenderingContext2D, player: Entity, isSliding: boolean, frameTick: number) => {
  const { x, y, w, h } = player;
  
  // Animation bounce
  const bounce = isSliding ? 0 : Math.sin(frameTick * 0.2) * 3;

  // Body/Dress
  if (isSliding) {
    // Sliding Sprite
    // Dress flows back
    drawRect(ctx, x, y + h - 30, w + 20, 30, COLORS.playerDress); 
    // Torso leaning back
    drawRect(ctx, x, y + h - 45, 40, 15, COLORS.playerDress);
    // Head low
    drawRect(ctx, x + 5, y + h - 65, 20, 20, COLORS.playerSkin); 
    // Hair
    drawRect(ctx, x + 5, y + h - 70, 25, 10, COLORS.playerHair); 
  } else {
    // Running Sprite
    // Skirt (Wide at bottom)
    drawRect(ctx, x - 10, y + 40 - bounce, w + 20, h - 40, COLORS.playerDress);
    // Torso
    drawRect(ctx, x + 10, y - bounce, w - 20, 40, COLORS.playerDress);
    // Head
    drawRect(ctx, x + 12, y - 25 - bounce, 26, 26, COLORS.playerSkin);
    // Hair
    drawRect(ctx, x + 10, y - 35 - bounce, 30, 15, COLORS.playerHair);
    // Arms (swinging)
    const armSwing = Math.sin(frameTick * 0.3) * 20;
    drawRect(ctx, x + 20 + armSwing, y + 20 - bounce, 10, 10, COLORS.playerSkin);
    
    // Glass Slipper (Sparkle)
    if (frameTick % 20 < 10) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + w, y + h - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

export const drawGuard = (ctx: CanvasRenderingContext2D, guard: Entity, frameTick: number) => {
  const { x, y, w, h } = guard;
  const bounce = Math.sin(frameTick * 0.25) * 4;

  // Legs (Black Pants)
  drawRect(ctx, x, y + 50 - bounce, w, h - 50, '#1a202c');
  // Coat (Red)
  drawRect(ctx, x - 5, y - bounce, w + 10, 60, COLORS.guardUniform);
  // Gold Buttons
  drawRect(ctx, x + 10, y + 10 - bounce, 5, 5, '#ecc94b');
  drawRect(ctx, x + 10, y + 30 - bounce, 5, 5, '#ecc94b');
  // Head
  drawRect(ctx, x + 10, y - 25 - bounce, 30, 25, COLORS.playerSkin);
  // Big Hat (Black tall hat)
  drawRect(ctx, x + 5, y - 55 - bounce, 40, 35, COLORS.guardHat);
  // Angry Eyes
  drawRect(ctx, x + 15, y - 15 - bounce, 5, 2, '#000');
  drawRect(ctx, x + 30, y - 15 - bounce, 5, 2, '#000');
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Entity) => {
  if (obs.type === EntityType.OBSTACLE_LOW) {
    // Wooden Crate
    drawRect(ctx, obs.x, obs.y, obs.w, obs.h, COLORS.obstacleWood);
    // X pattern
    ctx.strokeStyle = '#4c2d0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y);
    ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
    ctx.moveTo(obs.x + obs.w, obs.y);
    ctx.lineTo(obs.x, obs.y + obs.h);
    ctx.stroke();
    // Border
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
  } else if (obs.type === EntityType.OBSTACLE_HIGH) {
    // Floating Banner or Chandelier
    // Use a chain to hold it
    drawRect(ctx, obs.x + obs.w/2 - 2, 0, 4, obs.y, '#718096'); // Chain
    
    // The obstacle body (Chandelier)
    drawRect(ctx, obs.x, obs.y, obs.w, obs.h * 0.6, '#ecc94b'); // Gold top
    drawRect(ctx, obs.x + 10, obs.y + obs.h * 0.6, obs.w - 20, obs.h * 0.4, '#fff'); // Candles/Glass
  }
};

export const drawChariot = (ctx: CanvasRenderingContext2D, char: Entity) => {
  // Pumpkin shape roughly
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.ellipse(char.x + char.w/2, char.y + char.h/2, char.w/2, char.h/2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Wheels
  ctx.fillStyle = '#4a5568'; // Wheel color
  ctx.beginPath();
  ctx.arc(char.x + 10, char.y + char.h, 20, 0, Math.PI * 2);
  ctx.arc(char.x + char.w - 10, char.y + char.h, 20, 0, Math.PI * 2);
  ctx.fill();

  // Door
  ctx.fillStyle = '#ecc94b';
  ctx.fillRect(char.x + char.w/2 - 15, char.y + 20, 30, 40);
};