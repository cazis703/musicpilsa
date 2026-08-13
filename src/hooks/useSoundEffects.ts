"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SoundPool } from "@/lib/sound-pool";
import { DEFAULT_KEY_SWITCH, KEY_SWITCH_OPTIONS, getKeySwitchSrc, type KeySwitchType } from "@/data/keySwitches";

export interface UseSoundEffectsReturn {
  sfxVolume: number;
  setSfxVolume: (value: number) => void;
  isSfxMuted: boolean;
  toggleSfxMute: () => void;
  keySwitchType: KeySwitchType;
  setKeySwitchType: (type: KeySwitchType) => void;
  playTypingSound: () => void;
  playClickSound: () => void;
}

const CLICK_SOUND_SRC = "/media/sfx/ui-click.wav";

const TYPING_POOL_SIZE = 4;
const CLICK_POOL_SIZE = 3;

const DEFAULT_SFX_VOLUME = 0.5;
export const SFX_VOLUME_STORAGE_KEY = "musicpilsa:sfxVolume";
export const KEY_SWITCH_STORAGE_KEY = "musicpilsa:keySwitchType";

export function useSoundEffects(): UseSoundEffectsReturn {
  const [sfxVolume, setSfxVolumeState] = useState(DEFAULT_SFX_VOLUME);
  // 배경음악의 isMuted와 동일한 역할: 볼륨 값은 그대로 둔 채 재생 여부만 별도로 끈다
  // (스피커 음소거 버튼과 동일한 UX를 효과음 쪽에도 제공하기 위함).
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [keySwitchType, setKeySwitchTypeState] = useState<KeySwitchType>(DEFAULT_KEY_SWITCH);

  const typingPoolRef = useRef<SoundPool | null>(null);
  const clickPoolRef = useRef<SoundPool | null>(null);

  // 마운트 첫 실행에서는 (기본값 or 복원값 여부와 무관하게) localStorage에 다시 쓰지 않기 위한 가드.
  const didMountVolumeRef = useRef(false);
  const didMountKeySwitchRef = useRef(false);

  // localStorage 복원은 마운트 이후 1회만 수행한다(useBackgroundMedia의 랜덤 선택과 동일한
  // 이유: 마운트 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  useEffect(() => {
    const storedVolume = window.localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
    if (storedVolume !== null) {
      const parsed = Number(storedVolume);
      if (!Number.isNaN(parsed)) {
        setSfxVolumeState(Math.min(1, Math.max(0, parsed)));
      }
    }

    const storedSwitch = window.localStorage.getItem(KEY_SWITCH_STORAGE_KEY);
    if (storedSwitch && KEY_SWITCH_OPTIONS.some((option) => option.id === storedSwitch)) {
      setKeySwitchTypeState(storedSwitch as KeySwitchType);
    }
  }, []);

  // 클릭음 풀은 소스가 고정이라 마운트 시 1회만 생성한다.
  useEffect(() => {
    clickPoolRef.current = new SoundPool(CLICK_SOUND_SRC, CLICK_POOL_SIZE, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sfxVolume은 최초 볼륨 값으로만 쓰이며
    // 이후 변경은 아래 별도 effect가 담당한다.
  }, []);

  // 타건음 풀은 스위치 타입이 바뀔 때마다 해당 wav로 다시 생성한다.
  useEffect(() => {
    typingPoolRef.current = new SoundPool(getKeySwitchSrc(keySwitchType), TYPING_POOL_SIZE, sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 위와 동일한 이유로 sfxVolume은 최초값만 사용.
  }, [keySwitchType]);

  // 슬라이더 조작 시: 두 풀 모두 동일한 볼륨으로 동기화 + localStorage 저장.
  // 단, 마운트 직후 첫 실행(복원 전 기본값 or 복원 직후 값)은 저장을 건너뛴다 —
  // 방금 읽은 값을 그대로 다시 쓰는 불필요한 write를 없애기 위함.
  useEffect(() => {
    typingPoolRef.current?.setVolume(sfxVolume);
    clickPoolRef.current?.setVolume(sfxVolume);
    if (!didMountVolumeRef.current) {
      didMountVolumeRef.current = true;
      return;
    }
    window.localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    if (!didMountKeySwitchRef.current) {
      didMountKeySwitchRef.current = true;
      return;
    }
    window.localStorage.setItem(KEY_SWITCH_STORAGE_KEY, keySwitchType);
  }, [keySwitchType]);

  const setSfxVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setSfxVolumeState(clamped);
    if (clamped > 0) setIsSfxMuted(false);
  }, []);

  const toggleSfxMute = useCallback(() => {
    setIsSfxMuted((prev) => !prev);
  }, []);

  const setKeySwitchType = useCallback((type: KeySwitchType) => {
    setKeySwitchTypeState(type);
  }, []);

  // sfxVolume <= 0이거나 음소거 상태일 때 play() 자체를 호출하지 않는다: (1) 무음을 코드로
  // 명시적으로 보장하고, (2) 불필요한 재생 호출을 줄여 빠른 연속 타이핑 시 성능 낭비를 막는다.
  const playTypingSound = useCallback(() => {
    if (isSfxMuted || sfxVolume <= 0) return;
    typingPoolRef.current?.play();
  }, [isSfxMuted, sfxVolume]);

  const playClickSound = useCallback(() => {
    if (isSfxMuted || sfxVolume <= 0) return;
    clickPoolRef.current?.play();
  }, [isSfxMuted, sfxVolume]);

  return {
    sfxVolume,
    setSfxVolume,
    isSfxMuted,
    toggleSfxMute,
    keySwitchType,
    setKeySwitchType,
    playTypingSound,
    playClickSound,
  };
}
