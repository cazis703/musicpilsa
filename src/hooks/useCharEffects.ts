"use client";

import { useEffect, useRef, useState } from "react";
import { FADE_DURATION_MS, GLOW_DURATION_MS, SETTLED_DURATION_MS } from "@/lib/particle-utils";
import type { CharState } from "@/types/typing";

export interface UseCharEffectsReturn {
  visualCharStates: CharState[];
}

/**
 * 판정용 charStates(useSentenceTyping)를 입력받아, glowing -> settled -> fading -> gone
 * 시각 전이만 별도 rAF 루프에서 스케줄링한다. 판정 로직과는 상태를 공유하지 않는다.
 */
export function useCharEffects(sourceCharStates: CharState[]): UseCharEffectsReturn {
  const [visualCharStates, setVisualCharStates] = useState<CharState[]>(sourceCharStates);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setVisualCharStates((prev) => {
      return sourceCharStates.map((source, index) => {
        const previous = prev[index];
        if (
          previous &&
          previous.char === source.char &&
          source.glowStartedAt === previous.glowStartedAt
        ) {
          return { ...previous, isTypo: source.isTypo };
        }
        return { ...source };
      });
    });
  }, [sourceCharStates]);

  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      setVisualCharStates((prev) => {
        let changed = false;
        const next = prev.map((charState) => {
          if (charState.glowStartedAt === null) return charState;

          const elapsed = now - charState.glowStartedAt;

          if (charState.status === "glowing" && elapsed >= GLOW_DURATION_MS) {
            changed = true;
            return { ...charState, status: "settled" as const };
          }

          if (
            charState.status === "settled" &&
            elapsed >= GLOW_DURATION_MS + SETTLED_DURATION_MS
          ) {
            changed = true;
            return { ...charState, status: "fading" as const };
          }

          if (
            charState.status === "fading" &&
            elapsed >= GLOW_DURATION_MS + SETTLED_DURATION_MS + FADE_DURATION_MS
          ) {
            changed = true;
            return { ...charState, status: "gone" as const };
          }

          return charState;
        });
        return changed ? next : prev;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { visualCharStates };
}
