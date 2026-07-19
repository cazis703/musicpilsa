import type { SentenceItem } from "@/types/sentence";

export type CharStatus = "pending" | "glowing" | "settled" | "fading" | "gone";

export interface CharState {
  char: string;
  status: CharStatus;
  isTypo: boolean;
  glowStartedAt: number | null;
}

export interface SentenceTypingState {
  currentSentence: SentenceItem;
  charStates: CharState[];
  correctCount: number;
  previousSentenceId: number | null;
}
