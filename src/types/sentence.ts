export interface SentenceItem {
  id: number; // Set 내 순번 (1~20) — Set이 바뀌어도 각 Set 내부에서는 1~20으로 재사용됨
  text: string;
  // 하다체/습니다체 버전 — "위로" Set은 청자가 "당신"이라 하다체 전환 시 반말처럼
  // 들려 어색하므로 제공하지 않는다(둘 다 undefined). 그 경우 톤을 바꿔도 해요체(text)로 표시.
  textFormal?: string;
  textPolite?: string;
}

export type SentenceTone = "haeyo" | "formal" | "polite";
// "해요체(기본)" | "하다체" | "습니다체"

export type SentenceSetId = "healing" | "wisdom" | "positive" | "affirmation";
// "위로" | "격언" | "긍정" | "확언" — PRD 부록 A-1~A-4에 1:1 대응

export interface SentenceSetMeta {
  id: SentenceSetId;
  label: string; // 모달에 표시할 한글 라벨: "위로", "격언", "긍정", "확언"
}

export interface SentenceSet extends SentenceSetMeta {
  sentences: SentenceItem[]; // 정확히 20개
}
