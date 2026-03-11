export interface WordEntry {
  word: string;
  meaning: string;
  level: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameState {
  score: number;
  life: number;
  level: number;
  combo: number;
  status: 'idle' | 'studying' | 'playing' | 'gameover' | 'stageclear' | 'gamecomplete';
  difficulty: Difficulty;
  stageProgress: number; // Number of words correctly matched in current level
}
