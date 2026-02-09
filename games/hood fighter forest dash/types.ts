export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum PlayerState {
  RUNNING = 'RUNNING',
  JUMPING = 'JUMPING',
  SLIDING = 'SLIDING',
  IDLE = 'IDLE', // Used for start/win
  HIT = 'HIT'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export enum ObstacleType {
  ROCK = 'ROCK',    // Jump over
  BIRD = 'BIRD'     // Slide under
}

export interface Obstacle extends Rect {
  id: number;
  type: ObstacleType;
  passed: boolean;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  groundY: number;
  speed: number;
  totalTime: number;
}