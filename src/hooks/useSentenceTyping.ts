"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickNextSentence } from "@/lib/sentence-utils";
import { isCorrectChar } from "@/lib/typing-judge";
import { SENTENCE_SETS, getSentenceSet } from "@/data/sentences";
import type { CharState } from "@/types/typing";
import type { SentenceItem, SentenceSetId } from "@/types/sentence";

const NEXT_SENTENCE_DELAY_MS = 800;
// 하이드레이션 안전성: Set과 문장 모두 고정 리터럴(첫 번째 Set, 그 안의 첫 문장)로 초기화하고,
// 랜덤화는 반드시 마운트 후 useEffect(빈 deps)에서만 수행한다. Set 자체를 마운트 시점에
// 랜덤으로 고르지 않는다 — 서버/클라이언트 렌더 결과가 달라지는 하이드레이션 불일치를 방지하기 위함.
const INITIAL_SET_ID: SentenceSetId = SENTENCE_SETS[0].id;
const INITIAL_SENTENCE: SentenceItem = SENTENCE_SETS[0].sentences[0];

function createInitialCharStates(text: string): CharState[] {
  return Array.from(text).map((char) => ({
    char,
    status: "pending",
    isTypo: false,
    glowStartedAt: null,
  }));
}

export interface UseSentenceTypingReturn {
  currentSentence: SentenceItem;
  charStates: CharState[];
  cursorIndex: number;
  handleInputValue: (fullValue: string) => void;
  confirmIfComplete: () => void;
  activeSetId: SentenceSetId;
  setActiveSet: (setId: SentenceSetId) => void;
  skipSentence: () => void;
}

export function useSentenceTyping(): UseSentenceTypingReturn {
  const [activeSetId, setActiveSetId] = useState<SentenceSetId>(INITIAL_SET_ID);
  const [currentSentence, setCurrentSentence] = useState<SentenceItem>(INITIAL_SENTENCE);
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    createInitialCharStates(INITIAL_SENTENCE.text)
  );
  const cursorIndexRef = useRef(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 전환/건너뛰기/Set 변경 3곳 모두 "문장을 어떻게 바꾸는가"는 동일한 절차이므로
  // 하나의 공용 함수로 묶어 재사용한다 (previousId를 인자로 받아 연속 반복만 방지).
  const goToNextSentence = useCallback((sentences: SentenceItem[], previousId: number | null) => {
    const next = pickNextSentence(sentences, previousId);
    setCurrentSentence(next);
    setCharStates(createInitialCharStates(next.text));
    cursorIndexRef.current = 0;
    setCursorIndex(0);
    return next;
  }, []);

  useEffect(() => {
    goToNextSentence(SENTENCE_SETS[0].sentences, INITIAL_SENTENCE.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const setActiveSet = useCallback(
    (setId: SentenceSetId) => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      setActiveSetId(setId);
      const nextSentences = getSentenceSet(setId).sentences;
      // 다른 Set으로 넘어가는 순간이므로 이전 Set 기준의 previousSentenceId 제약은 적용하지 않는다.
      goToNextSentence(nextSentences, null);
    },
    [goToNextSentence]
  );

  const skipSentence = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    const currentSentences = getSentenceSet(activeSetId).sentences;
    goToNextSentence(currentSentences, currentSentence.id);
  }, [activeSetId, currentSentence.id, goToNextSentence]);

  // IME(한글 조합) 환경에서는 keydown/isComposing 기반 글자 단위 판정이 조합 타이밍에 따라
  // 어긋나기 쉬우므로, 매번 "지금까지 입력창에 실제로 채워진 전체 문자열"을 정답 문장의
  // 앞부분과 통째로 비교하는 방식을 사용한다. IME 조합 중간 상태(자모)는 정답과 자연히
  // 어긋나 무시되고, 조합이 완성되어 정답과 일치하는 순간에만 커서가 전진한다.
  const handleInputValue = useCallback(
    (fullValue: string) => {
      const target = currentSentence.text;
      let matchedLength = 0;
      while (
        matchedLength < fullValue.length &&
        matchedLength < target.length &&
        isCorrectChar(fullValue[matchedLength], target[matchedLength])
      ) {
        matchedLength++;
      }

      const hasTypo = fullValue.length > matchedLength;
      const previousIndex = cursorIndexRef.current;

      if (matchedLength === previousIndex && !hasTypo) return;

      const now = performance.now();
      setCharStates((prev) =>
        prev.map((state, i) => {
          if (i < matchedLength) {
            return i < previousIndex
              ? state
              : { ...state, status: "glowing", isTypo: false, glowStartedAt: now };
          }
          return { ...state, isTypo: i === matchedLength && hasTypo };
        })
      );

      cursorIndexRef.current = matchedLength;
      setCursorIndex(matchedLength);

      if (matchedLength >= target.length && matchedLength > previousIndex) {
        if (advanceTimeoutRef.current) {
          clearTimeout(advanceTimeoutRef.current);
        }
        const completedSentenceId = currentSentence.id;
        advanceTimeoutRef.current = setTimeout(() => {
          advanceTimeoutRef.current = null;
          const currentSentences = getSentenceSet(activeSetId).sentences;
          goToNextSentence(currentSentences, completedSentenceId);
        }, NEXT_SENTENCE_DELAY_MS);
      }
    },
    [activeSetId, currentSentence.id, currentSentence.text, goToNextSentence]
  );

  // 문장을 이미 끝까지 정확히 입력한 상태(자동 전환 대기 중)에서 Enter 키를 누르면,
  // 800ms 대기를 기다리지 않고 즉시 다음 문장으로 넘어간다. <input type="text">는
  // Enter 키 자체로 value가 바뀌지 않으므로(input 이벤트 미발생) 별도 트리거가 필요하다.
  const confirmIfComplete = useCallback(() => {
    if (cursorIndexRef.current < currentSentence.text.length) return;
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    const currentSentences = getSentenceSet(activeSetId).sentences;
    goToNextSentence(currentSentences, currentSentence.id);
  }, [activeSetId, currentSentence.id, currentSentence.text.length, goToNextSentence]);

  return {
    currentSentence,
    charStates,
    cursorIndex,
    handleInputValue,
    confirmIfComplete,
    activeSetId,
    setActiveSet,
    skipSentence,
  };
}
