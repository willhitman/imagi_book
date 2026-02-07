export interface StoryPage {
  text: string;
  imagePrompt: string;
  videoUrl?: string; // Hydrated after Veo generation
  audioBuffer?: AudioBuffer; // Hydrated after TTS
  isGenerating?: boolean;
}

export interface Story {
  id: string;
  title: string;
  pages: StoryPage[];
  coverColor: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppView {
  LIBRARY = 'LIBRARY',
  READER = 'READER',
}

export type ChallengeType = 'CHOICE' | 'RIDDLE' | 'FRIEND' | 'TOOL' | 'SEARCH';

export interface GameChoice {
  text: string;
  outcome: string;
}

export interface GameChallenge {
  type: ChallengeType;
  prompt: string;
  choices: GameChoice[];
}