import type { SentenceItem } from "@/types/sentence";

export type CharStatus = "pending" | "glowing" | "settled";

export interface CharState {
  char: string;
  status: CharStatus;
  isTypo: boolean;
  // 지금 한창 한글 자모로 조합되고 있는 바로 그 글자인지 여부. true인 동안은 정오 판정을
  // 보류하고 실제 입력 내용(typedChar)을 흰색으로 그대로 보여준다 — 다음 글자로 넘어가는
  // 순간(조합 세션이 끝나지 않았어도) 그제서야 isTypo 여부가 확정된다.
  isComposingChar: boolean;
  typedChar?: string; // isTypo 또는 isComposingChar일 때 실제로 입력한 글자 (목표 글자 대신 이걸 보여줌)
  glowStartedAt: number | null;
}

export interface SentenceTypingState {
  currentSentence: SentenceItem;
  charStates: CharState[];
  correctCount: number;
  previousSentenceId: number | null;
}
