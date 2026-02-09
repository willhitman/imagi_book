export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  GUARD = 'GUARD',
  OBSTACLE_LOW = 'OBSTACLE_LOW',
  OBSTACLE_HIGH = 'OBSTACLE_HIGH',
  CHARIOT = 'CHARIOT',
  DECORATION = 'DECORATION'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entity extends Rect {
  type: EntityType;
  id: number;
  vx?: number; // Velocity X
  vy?: number; // Velocity Y
  passed?: boolean; // For scoring
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}