// Internal resolution for pixel art look (Scale up in CSS)
// Scaled up by 10% (320 -> 352, 180 -> 198)
export const GAME_WIDTH = 352;
export const GAME_HEIGHT = 198;

// Physics 
export const GRAVITY = 0.44;
export const JUMP_FORCE = -8.1;
export const GROUND_Y = GAME_HEIGHT - 32;

// Scroll speeds 
export const INITIAL_SPEED = 2.43; 
export const MAX_SPEED = 4.85;
export const TOTAL_TIME = 90; // Seconds

// Colors - Modern Vector / Cartoon Palette
export const COLORS = {
  skyTop: '#4facfe',
  skyBottom: '#00f2fe',
  ground: '#43a047',
  groundDark: '#2e7d32',
  grassHighlight: '#66bb6a',
  red: '#ff1744',
  redDark: '#d50000',
  skin: '#ffccbc',
  wolf: '#546e7a',
  wolfDark: '#37474f',
  wolfEye: '#ffeb3b',
  rock: '#78909c',
  rockDark: '#546e7a',
  bird: '#ffd600',
  birdBeak: '#ff6d00',
  white: '#ffffff',
  text: '#263238',
};

export const PALETTE = [];