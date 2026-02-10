export enum GameState {
  MENU = 'MENU',
  RACING = 'RACING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface Entity {
  x: number; // 0 to 100 (percentage of road width)
  z: number; // Distance from start
  width: number;
  height: number;
}

export interface PowerUp extends Entity {
  id: string;
  type: 'SPEED' | 'SLOW_HARE'; // Currently focused on speed
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  gravity?: number;
}

export interface CrowdMember {
  x: number; // Relative to road width (e.g., -20 is left grass, 120 is right grass)
  z: number;
  color: string;
  type: 'bear' | 'rabbit' | 'fox';
  jumpOffset: number;
}

export interface GameStats {
  score: number;
  time: number;
  speed: number;
  distance: number;
  hareDistance: number;
}