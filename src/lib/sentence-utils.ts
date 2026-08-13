import type { SentenceItem } from "@/types/sentence";

export function pickNextSentence(
  sentences: SentenceItem[],
  previousSentenceId: number | null
): SentenceItem {
  const candidates =
    sentences.length > 1
      ? sentences.filter((sentence) => sentence.id !== previousSentenceId)
      : sentences;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
