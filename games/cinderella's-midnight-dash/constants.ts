export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450; // 16:9 aspect ratio roughly

export const GROUND_Y = 380;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 90;
export const PLAYER_SLIDE_HEIGHT = 45; // Ducking height

export const GRAVITY = 0.6;
export const JUMP_FORCE = -14;
export const RUN_SPEED = 6; // Background scroll speed / obstacle move speed
export const GUARD_CATCH_SPEED = 0.5; // How fast guard catches up when stumbling

export const GAME_DURATION_MS = 90000; // 90 seconds
export const OBSTACLE_SPAWN_RATE_MIN = 1500; // ms
export const OBSTACLE_SPAWN_RATE_MAX = 3000; // ms

// Colors (Tailwind palette approximation for canvas)
export const COLORS = {
  sky: '#1a202c', // Dark blue night
  floor: '#718096', // Stone grey
  carpet: '#9b2c2c', // Red carpet
  playerDress: '#4299e1', // Blue dress
  playerSkin: '#fbd38d', 
  playerHair: '#faf089',
  guardUniform: '#e53e3e', // Red uniform
  guardHat: '#000000',
  obstacleWood: '#744210',
  chariotGold: '#ecc94b',
  sparkle: '#fff'
};