import type { SentenceItem, SentenceSetId, SentenceSetMeta } from "@/types/sentence";

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

export function pickNextSetId(sets: SentenceSetMeta[], currentSetId: SentenceSetId): SentenceSetId {
  const currentIndex = sets.findIndex((set) => set.id === currentSetId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sets.length;
  return sets[nextIndex].id;
}
