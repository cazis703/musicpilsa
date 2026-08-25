"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioControlsReturn {
  isMuted: boolean;
  volume: number;
  isPlaying: boolean;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  togglePlay: () => void;
}

export const attemptAutoplay = (audioEl: HTMLAudioElement | null) => {
  if (!audioEl) return;
  audioEl.play().catch(() => {
    // 자동재생 거부(NotAllowedError)는 오류가 아니라 사용자 인터랙션 대기 상태로 간주.
  });
};

export const BGM_VOLUME_STORAGE_KEY = "musicpilsa:bgmVolume";
export const DEFAULT_BGM_VOLUME = 0.5;

export function useAudioControls(audioRef: React.RefObject<HTMLAudioElement>): UseAudioControlsReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_BGM_VOLUME);
  const [isPlaying, setIsPlaying] = useState(false);
  // 마운트 첫 실행에서는 (기본값 or 복원값 여부와 무관하게) localStorage에 다시 쓰지 않기 위한 가드.
  const didMountRef = useRef(false);

  // 볼륨 복원 (마운트 후 1회)
  useEffect(() => {
    const stored = window.localStorage.getItem(BGM_VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) setVolumeState(Math.min(1, Math.max(0, parsed)));
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [audioRef, volume, isMuted]);

  // ★ 핵심: isPlaying은 버튼 클릭이 아니라 <audio> 엘리먼트가 실제로 발생시키는
  // 'play'/'pause' 네이티브 이벤트를 구독해 동기화한다. 이렇게 하면 (1) 버튼으로
  // 직접 멈추고 재생하는 경우, (2) 브라우저 자동재생 정책으로 최초 재생이 막힌 경우,
  // (3) useBackgroundMedia가 트랙을 자동 전환(ended)하며 audio.load()/play()를
  // 다시 호출하는 경우까지 모두 "버튼 아이콘이 실제 재생 상태와 100% 일치"해야 한다는
  // 수용 기준을 별도 분기 처리 없이 하나의 리스너로 만족시킬 수 있다.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    setIsPlaying(!audio.paused); // 리스너 부착 시점의 실제 상태로 즉시 동기화
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioRef]);

  // 마운트 직후 첫 실행(복원 전 기본값 or 복원 직후 값)은 저장을 건너뛴다 —
  // 방금 읽은 값을 그대로 다시 쓰는 불필요한 write를 없애기 위함.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    window.localStorage.setItem(BGM_VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  // 상태를 직접 setIsPlaying으로 낙관적 갱신하지 않는다. audio.play()/pause() 호출 결과로
  // 발생하는 네이티브 이벤트가 위 리스너를 통해 상태를 갱신하므로, 상태의 단일 진실 공급원은
  // 항상 실제 <audio> 엘리먼트가 된다(음소거/볼륨과 완전히 독립적으로 동작 — 수용 기준 4, 5).
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef]);

  return { isMuted, volume, isPlaying, toggleMute, setVolume, togglePlay };
}
