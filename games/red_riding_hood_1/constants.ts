import { FlowerType, LevelConfig } from './types';

export const LEVEL_CONFIG: LevelConfig = {
  timeLimit: 180,
  required: {
    [FlowerType.RED_ROSE]: 5,
    [FlowerType.BLUE_VIOLET]: 5,
    [FlowerType.YELLOW_DAISY]: 5,
    [FlowerType.WHITE_WEED]: 0,
  },
  spawnCounts: {
    [FlowerType.RED_ROSE]: 10,
    [FlowerType.BLUE_VIOLET]: 10,
    [FlowerType.YELLOW_DAISY]: 10,
    [FlowerType.WHITE_WEED]: 8,
  },
};

export const FLOWER_COLORS = {
  [FlowerType.RED_ROSE]: 'text-red-500',
  [FlowerType.BLUE_VIOLET]: 'text-blue-500',
  [FlowerType.YELLOW_DAISY]: 'text-yellow-400',
  [FlowerType.WHITE_WEED]: 'text-gray-300',
};

// Points per flower
export const FLOWER_SCORE = 10;
export const TIME_BONUS_MULTIPLIER = 5;
