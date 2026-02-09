export enum FlowerType {
  RED_ROSE = 'RED_ROSE',
  BLUE_VIOLET = 'BLUE_VIOLET',
  YELLOW_DAISY = 'YELLOW_DAISY',
  WHITE_WEED = 'WHITE_WEED', // Distractor
}

export interface FlowerData {
  id: string;
  type: FlowerType;
  x: number;
  y: number;
  rotation: number;
}

export interface GameState {
  status: 'START' | 'PLAYING' | 'FINISHED' | 'GAME_OVER';
  score: number;
  timeLeft: number;
  inventory: Record<FlowerType, number>;
}

export interface LevelConfig {
  required: Record<FlowerType, number>; // How many of each are needed
  timeLimit: number;
  spawnCounts: Record<FlowerType, number>; // How many spawn on the field
}