"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickNextSentence } from "@/lib/sentence-utils";
import { isCorrectChar } from "@/lib/typing-judge";
import { SENTENCES } from "@/data/sentences";
import type { CharState } from "@/types/typing";
import type { SentenceItem } from "@/types/sentence";

const NEXT_SENTENCE_DELAY_MS = 800;
const INITIAL_SENTENCE: SentenceItem = SENTENCES[0];

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
}

export function useSentenceTyping(): UseSentenceTypingReturn {
  const previousSentenceIdRef = useRef<number | null>(null);
  const [currentSentence, setCurrentSentence] = useState<SentenceItem>(INITIAL_SENTENCE);
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    createInitialCharStates(INITIAL_SENTENCE.text)
  );
  const cursorIndexRef = useRef(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    previousSentenceIdRef.current = INITIAL_SENTENCE.id;
    const randomized = pickNextSentence(INITIAL_SENTENCE.id);
    setCurrentSentence(randomized);
    setCharStates(createInitialCharStates(randomized.text));
    cursorIndexRef.current = 0;
    setCursorIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToNextSentence = useCallback(() => {
    previousSentenceIdRef.current = currentSentence.id;
    const next = pickNextSentence(previousSentenceIdRef.current);
    setCurrentSentence(next);
    setCharStates(createInitialCharStates(next.text));
    cursorIndexRef.current = 0;
    setCursorIndex(0);
  }, [currentSentence.id]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

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
        advanceTimeoutRef.current = setTimeout(() => {
          goToNextSentence();
        }, NEXT_SENTENCE_DELAY_MS);
      }
    },
    [currentSentence.text, goToNextSentence]
  );

  return { currentSentence, charStates, cursorIndex, handleInputValue };
}
