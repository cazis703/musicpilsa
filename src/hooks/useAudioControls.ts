"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseAudioControlsReturn {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (value: number) => void;
}

export const attemptAutoplay = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  audioEl.play().catch(() => {
    // 자동재생 거부(NotAllowedError)는 오류가 아니라 사용자 인터랙션 대기 상태로 간주.
  });
};

export function useAudioControls(audioRef: React.RefObject<HTMLAudioElement>): UseAudioControlsReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [audioRef, volume, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (clamped > 0) {
      setIsMuted(false);
    }
  }, []);

  return { isMuted, volume, toggleMute, setVolume };
}
