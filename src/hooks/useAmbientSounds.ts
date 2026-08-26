"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AMBIENT_SOUNDS, getAmbientSoundMeta } from "@/data/ambientSounds";
import { clampAmbientPosition } from "@/lib/ambient-orb-geometry";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";

export const AMBIENT_SOUND_STORAGE_KEY = "musicpilsa:ambientSounds";

export interface UseAmbientSoundsReturn {
  activeIds: AmbientSoundId[];
  positions: AmbientSoundPositions;
  isActive: (id: AmbientSoundId) => boolean;
  addSound: (id: AmbientSoundId) => void;
  removeSound: (id: AmbientSoundId) => void;
  toggleSound: (id: AmbientSoundId) => void;
  setPosition: (id: AmbientSoundId, x: number, y: number) => void;
  setVolume: (id: AmbientSoundId, volume: number) => void;
  resumeAll: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useAmbientSounds(): UseAmbientSoundsReturn {
  const [positions, setPositions] = useState<AmbientSoundPositions>({});
  const audioElsRef = useRef<Map<AmbientSoundId, HTMLAudioElement>>(new Map());
  const didMountRef = useRef(false);

  // localStorage 복원은 마운트 이후 1회만 수행한다(다른 오디오/설정 훅과 동일한 이유:
  // 마운트 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  useEffect(() => {
    const stored = window.localStorage.getItem(AMBIENT_SOUND_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as AmbientSoundPositions;
      const restored: AmbientSoundPositions = {};
      for (const sound of AMBIENT_SOUNDS) {
        const entry = parsed[sound.id];
        if (entry && typeof entry.x === "number" && typeof entry.y === "number" && typeof entry.volume === "number") {
          const safeVolume = clamp(entry.volume, 0, 1);
          const safePosition = clampAmbientPosition(entry.x, entry.y);
          restored[sound.id] = {
            x: safePosition.x,
            y: safePosition.y,
            volume: safeVolume,
          };
        }
      }
      setPositions(restored);
    } catch {
      // 저장값이 손상됐으면 무시하고 기본(전부 꺼짐) 상태로 시작한다.
    }
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    window.localStorage.setItem(AMBIENT_SOUND_STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  // 활성 사운드 목록이 바뀔 때마다 <audio> 엘리먼트를 만들거나 정리한다. 재생 구간이
  // 정해진 사운드(연필/책장/풀벌레)는 loop 속성 대신 timeupdate/ended로 직접 구간을 반복한다.
  useEffect(() => {
    const activeIds = Object.keys(positions) as AmbientSoundId[];
    const elements = audioElsRef.current;

    for (const id of activeIds) {
      if (elements.has(id)) continue;
      const meta = getAmbientSoundMeta(id);
      if (!meta) continue;

      const audio = new Audio(meta.src);
      audio.playbackRate = meta.playbackRate;
      audio.volume = positions[id]?.volume ?? meta.defaultVolume;

      if (meta.clipEndSec === null) {
        audio.loop = true;
      } else {
        const clipEndSec = meta.clipEndSec;
        const loopToStart = () => {
          audio.currentTime = meta.clipStartSec;
          audio.play().catch(() => {});
        };
        audio.addEventListener("timeupdate", () => {
          if (audio.currentTime >= clipEndSec) loopToStart();
        });
        audio.addEventListener("ended", loopToStart);
      }

      audio.play().catch(() => {
        // 자동재생 거부(NotAllowedError)는 오류가 아니라 사용자 인터랙션 대기 상태로 간주.
      });
      elements.set(id, audio);
    }

    for (const [id, audio] of elements) {
      if (!activeIds.includes(id)) {
        audio.pause();
        audio.src = "";
        elements.delete(id);
      }
    }
  }, [positions]);

  // 볼륨 변경은 엘리먼트를 다시 만들지 않고 즉시 반영한다.
  useEffect(() => {
    for (const [id, audio] of audioElsRef.current) {
      const volume = positions[id]?.volume;
      if (typeof volume === "number") audio.volume = volume;
    }
  }, [positions]);

  // 언마운트 시 전체 정리.
  useEffect(() => {
    const elements = audioElsRef.current;
    return () => {
      for (const audio of elements.values()) {
        audio.pause();
        audio.src = "";
      }
      elements.clear();
    };
  }, []);

  // 브라우저 창 크기가 바뀌면 켜져 있는 오브들의 위치를 지금 창 기준 안전 범위로 다시
  // 가둔다 — 그러지 않으면 큰 창에서 가장자리 가까이 둔 오브가 창을 줄였을 때 화면 밖으로
  // 밀려난 것처럼 보인다(위치 %는 그대로여도 여백에 필요한 %가 창이 작아질수록 커지기 때문).
  useEffect(() => {
    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setPositions((prev) => {
          let changed = false;
          const next: AmbientSoundPositions = {};
          for (const id of Object.keys(prev) as AmbientSoundId[]) {
            const current = prev[id]!;
            const safePosition = clampAmbientPosition(current.x, current.y);
            if (safePosition.x !== current.x || safePosition.y !== current.y) changed = true;
            next[id] = { ...current, x: safePosition.x, y: safePosition.y };
          }
          return changed ? next : prev;
        });
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const isActive = useCallback((id: AmbientSoundId) => id in positions, [positions]);

  const addSound = useCallback((id: AmbientSoundId) => {
    setPositions((prev) => {
      if (prev[id]) return prev;
      const meta = getAmbientSoundMeta(id);
      if (!meta) return prev;
      const safePosition = clampAmbientPosition(meta.defaultX, meta.defaultY);
      return {
        ...prev,
        [id]: { x: safePosition.x, y: safePosition.y, volume: meta.defaultVolume },
      };
    });
  }, []);

  const removeSound = useCallback((id: AmbientSoundId) => {
    setPositions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggleSound = useCallback(
    (id: AmbientSoundId) => {
      setPositions((prev) => {
        if (prev[id]) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        const meta = getAmbientSoundMeta(id);
        if (!meta) return prev;
        const safePosition = clampAmbientPosition(meta.defaultX, meta.defaultY);
        return {
          ...prev,
          [id]: { x: safePosition.x, y: safePosition.y, volume: meta.defaultVolume },
        };
      });
    },
    []
  );

  const setPosition = useCallback((id: AmbientSoundId, x: number, y: number) => {
    setPositions((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const safePosition = clampAmbientPosition(x, y);
      return {
        ...prev,
        [id]: { ...current, x: safePosition.x, y: safePosition.y },
      };
    });
  }, []);

  const setVolume = useCallback((id: AmbientSoundId, volume: number) => {
    setPositions((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: { ...current, volume: clamp(volume, 0, 1) },
      };
    });
  }, []);

  // 최초 로드 시 복원된 사운드는 사용자 인터랙션 이전이라 브라우저 자동재생 정책에 막혀
  // 있을 수 있다. 배경음악과 동일하게 첫 클릭/입력 시점에 재시도한다.
  const resumeAll = useCallback(() => {
    for (const audio of audioElsRef.current.values()) {
      if (audio.paused) audio.play().catch(() => {});
    }
  }, []);

  return {
    activeIds: Object.keys(positions) as AmbientSoundId[],
    positions,
    isActive,
    addSound,
    removeSound,
    toggleSound,
    setPosition,
    setVolume,
    resumeAll,
  };
}
