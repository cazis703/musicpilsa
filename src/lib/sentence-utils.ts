import type { SentenceItem, SentenceTone } from "@/types/sentence";

// 선택된 톤에 맞는 실제 표시/판정 텍스트를 고른다. 하다체/습니다체 버전이 없는 문장
// (위로 Set 전체, 또는 아직 변환되지 않은 문장)은 항상 해요체(text)로 대체된다.
export function resolveSentenceText(sentence: SentenceItem, tone: SentenceTone): string {
  if (tone === "formal") return sentence.textFormal ?? sentence.text;
  if (tone === "polite") return sentence.textPolite ?? sentence.text;
  return sentence.text;
}

// Fisher-Yates 셔플 — 원본 배열을 변형하지 않고 새 배열을 반환한다.
function shuffle(sentences: SentenceItem[]): SentenceItem[] {
  const result = [...sentences];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Set 안의 모든 문장을 한 번씩 다 보여준 뒤에만 다시 섞어 새로운 순회를 시작한다("셔플백"
// 방식). 매번 완전 랜덤으로 뽑으면 최근 본 문장이 자주 재등장해 "몇 문장만 반복해서 보는"
// 편향이 생기므로, 큐가 비었을 때만 다시 섞어 채운다.
export function drawFromShuffleQueue(
  queue: SentenceItem[],
  sentences: SentenceItem[],
  previousSentenceId: number | null
): { sentence: SentenceItem; remainingQueue: SentenceItem[] } {
  let nextQueue = queue.length > 0 ? queue : shuffle(sentences);

  // 새로 섞은 큐의 맨 앞이 직전 문장과 같으면(셋 경계에서 우연히 이어질 수 있음) 뒤로 보낸다.
  if (nextQueue.length > 1 && nextQueue[0].id === previousSentenceId) {
    nextQueue = [...nextQueue.slice(1), nextQueue[0]];
  }

  const [sentence, ...rest] = nextQueue;
  return { sentence, remainingQueue: rest };
}
