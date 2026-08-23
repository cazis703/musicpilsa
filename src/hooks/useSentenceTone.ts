"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SentenceTone } from "@/types/sentence";

export interface UseSentenceToneReturn {
  tone: SentenceTone;
  setTone: (tone: SentenceTone) => void;
}

export const SENTENCE_TONE_STORAGE_KEY = "musicpilsa:sentenceTone";
export const DEFAULT_SENTENCE_TONE: SentenceTone = "haeyo";

export function useSentenceTone(): UseSentenceToneReturn {
  const [tone, setToneState] = useState<SentenceTone>(DEFAULT_SENTENCE_TONE);

  // localStorage 복원은 마운트 이후 1회만 수행한다(useFontSettings와 동일한 이유: 마운트
  // 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  const didMountRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SENTENCE_TONE_STORAGE_KEY);
    if (stored === "haeyo" || stored === "formal" || stored === "polite") {
      setToneState(stored);
    }
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    window.localStorage.setItem(SENTENCE_TONE_STORAGE_KEY, tone);
  }, [tone]);

  const setTone = useCallback((next: SentenceTone) => {
    setToneState(next);
  }, []);

  return { tone, setTone };
}
