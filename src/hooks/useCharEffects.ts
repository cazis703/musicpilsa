"use client";

import { useEffect, useRef, useState } from "react";
import { GLOW_DURATION_MS } from "@/lib/particle-utils";
import type { CharState } from "@/types/typing";

export interface UseCharEffectsReturn {
  visualCharStates: CharState[];
}

// 탭 비활성화 등으로 프레임 간격이 크게 벌어졌을 때, 그 시간만큼 한 번에 확 진행되어
// 보이는 것을 막기 위한 프레임당 최대 델타.
const MAX_FRAME_DELTA_MS = 100;

/**
 * 판정용 charStates(useSentenceTyping)를 입력받아, glowing -> settled 시각 전이만
 * 별도 rAF 루프에서 스케줄링한다. settled 이후로는 더 진행하지 않고(글자가 사라지지 않고
 * 하얀색으로 계속 남는다) 판정 로직과는 상태를 공유하지 않는다.
 *
 * 오타가 남아있는 동안(charState.isTypo가 하나라도 true)에는 애니메이션 시계 자체를 멈춘다.
 * `performance.now() - glowStartedAt` 같은 절대시각 차이 방식은 "멈췄다가 재개"를 표현할 수
 * 없으므로(멈춰있던 시간만큼 나중에 한꺼번에 진행돼버림), 글자별 경과시간을 프레임 델타
 * 누적으로 직접 관리하고, 정지 중에는 델타를 누적하지 않는 방식으로 구현한다.
 */
export function useCharEffects(sourceCharStates: CharState[]): UseCharEffectsReturn {
  const [visualCharStates, setVisualCharStates] = useState<CharState[]>(sourceCharStates);
  const elapsedMsRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    isPausedRef.current = sourceCharStates.some((state) => state.isTypo);

    setVisualCharStates((prev) => {
      return sourceCharStates.map((source, index) => {
        const previous = prev[index];
        if (
          previous &&
          previous.char === source.char &&
          source.glowStartedAt === previous.glowStartedAt
        ) {
          return {
            ...previous,
            isTypo: source.isTypo,
            isComposingChar: source.isComposingChar,
            typedChar: source.typedChar,
          };
        }
        // 새 글로우 시작 또는 새 문장 — 이 글자의 경과시간 누적을 0부터 다시 센다.
        elapsedMsRef.current[index] = 0;
        return { ...source };
      });
    });
  }, [sourceCharStates]);

  useEffect(() => {
    const tick = (time: number) => {
      const last = lastFrameTimeRef.current ?? time;
      const delta = Math.min(time - last, MAX_FRAME_DELTA_MS);
      lastFrameTimeRef.current = time;

      setVisualCharStates((prev) => {
        if (isPausedRef.current) return prev; // 오타가 남아있는 동안은 시계를 멈춘다 — delta를 누적하지 않는다.

        let changed = false;
        const next = prev.map((charState, index) => {
          // glowing 상태만 시간 경과를 지켜보면 된다 — settled는 종착 상태라 더 처리할 게 없다.
          if (charState.status !== "glowing" || charState.glowStartedAt === null) return charState;

          const elapsed = (elapsedMsRef.current[index] ?? 0) + delta;
          elapsedMsRef.current[index] = elapsed;

          if (elapsed >= GLOW_DURATION_MS) {
            changed = true;
            return { ...charState, status: "settled" as const };
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
