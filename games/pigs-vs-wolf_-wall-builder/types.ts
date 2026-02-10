export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  WOLF_BLOWING = 'WOLF_BLOWING',
  WIN = 'WIN',
  LOSE = 'LOSE'
}

export type BlockType = 'square' | 'circle' | 'triangle';

export interface GameBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  rotation: number;
  color: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
}