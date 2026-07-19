import { SENTENCES } from "@/data/sentences";
import type { SentenceItem } from "@/types/sentence";

export function pickNextSentence(previousSentenceId: number | null): SentenceItem {
  const candidates =
    SENTENCES.length > 1
      ? SENTENCES.filter((sentence) => sentence.id !== previousSentenceId)
      : SENTENCES;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
