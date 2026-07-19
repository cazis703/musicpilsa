export interface SentenceItem {
  id: number; // Set 내 순번 (1~20) — Set이 바뀌어도 각 Set 내부에서는 1~20으로 재사용됨
  text: string;
}

export type SentenceSetId = "healing" | "wisdom" | "positive" | "affirmation";
// "위로" | "격언" | "긍정" | "확언" — PRD 부록 A-1~A-4에 1:1 대응

export interface SentenceSetMeta {
  id: SentenceSetId;
  label: string; // 모달에 표시할 한글 라벨: "위로", "격언", "긍정", "확언"
}

export interface SentenceSet extends SentenceSetMeta {
  sentences: SentenceItem[]; // 정확히 20개
}
