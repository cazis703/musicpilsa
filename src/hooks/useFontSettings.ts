"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FontFamilyId = "sans" | "serif";

export interface UseFontSettingsReturn {
  fontSizeRem: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  fontWeight: number;
  increaseFontWeight: () => void;
  decreaseFontWeight: () => void;
  resetFontWeight: () => void;
  fontFamily: FontFamilyId;
  setFontFamily: (id: FontFamilyId) => void;
  fontStyle: React.CSSProperties;
}

export const FONT_SIZE_STORAGE_KEY = "musicpilsa:fontSize";
export const FONT_WEIGHT_STORAGE_KEY = "musicpilsa:fontWeight";
export const FONT_FAMILY_STORAGE_KEY = "musicpilsa:fontFamily";

export const DEFAULT_FONT_SIZE_REM = 1.875; // 30px, 기존 text-3xl과 동일
export const MIN_FONT_SIZE_REM = 1.25;
export const MAX_FONT_SIZE_REM = 2.75;
export const FONT_SIZE_STEP_REM = 0.125;

export const DEFAULT_FONT_WEIGHT = 500;
export const MIN_FONT_WEIGHT = 100;
export const MAX_FONT_WEIGHT = 900;
export const FONT_WEIGHT_STEP = 100;

export const DEFAULT_FONT_FAMILY: FontFamilyId = "serif";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useFontSettings(): UseFontSettingsReturn {
  const [fontSizeRem, setFontSizeRem] = useState(DEFAULT_FONT_SIZE_REM);
  const [fontWeight, setFontWeight] = useState(DEFAULT_FONT_WEIGHT);
  const [fontFamily, setFontFamilyState] = useState<FontFamilyId>(DEFAULT_FONT_FAMILY);

  // 마운트 첫 실행에서는(기본값 or 복원값 여부와 무관하게) localStorage에 다시 쓰지 않기 위한 가드.
  const didMountFontSizeRef = useRef(false);
  const didMountFontWeightRef = useRef(false);
  const didMountFontFamilyRef = useRef(false);

  // localStorage 복원은 마운트 이후 1회만 수행한다(useSoundEffects와 동일한 이유: 마운트
  // 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  useEffect(() => {
    const storedSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (storedSize !== null) {
      const parsed = Number(storedSize);
      if (!Number.isNaN(parsed)) {
        setFontSizeRem(clamp(parsed, MIN_FONT_SIZE_REM, MAX_FONT_SIZE_REM));
      }
    }

    const storedWeight = window.localStorage.getItem(FONT_WEIGHT_STORAGE_KEY);
    if (storedWeight !== null) {
      const parsed = Number(storedWeight);
      if (!Number.isNaN(parsed)) {
        setFontWeight(clamp(parsed, MIN_FONT_WEIGHT, MAX_FONT_WEIGHT));
      }
    }

    const storedFamily = window.localStorage.getItem(FONT_FAMILY_STORAGE_KEY);
    if (storedFamily === "sans" || storedFamily === "serif") {
      setFontFamilyState(storedFamily);
    }
  }, []);

  useEffect(() => {
    if (!didMountFontSizeRef.current) {
      didMountFontSizeRef.current = true;
      return;
    }
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSizeRem));
  }, [fontSizeRem]);

  useEffect(() => {
    if (!didMountFontWeightRef.current) {
      didMountFontWeightRef.current = true;
      return;
    }
    window.localStorage.setItem(FONT_WEIGHT_STORAGE_KEY, String(fontWeight));
  }, [fontWeight]);

  useEffect(() => {
    if (!didMountFontFamilyRef.current) {
      didMountFontFamilyRef.current = true;
      return;
    }
    window.localStorage.setItem(FONT_FAMILY_STORAGE_KEY, fontFamily);
  }, [fontFamily]);

  const increaseFontSize = useCallback(() => {
    setFontSizeRem((prev) => clamp(prev + FONT_SIZE_STEP_REM, MIN_FONT_SIZE_REM, MAX_FONT_SIZE_REM));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeRem((prev) => clamp(prev - FONT_SIZE_STEP_REM, MIN_FONT_SIZE_REM, MAX_FONT_SIZE_REM));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSizeRem(DEFAULT_FONT_SIZE_REM);
  }, []);

  const increaseFontWeight = useCallback(() => {
    setFontWeight((prev) => clamp(prev + FONT_WEIGHT_STEP, MIN_FONT_WEIGHT, MAX_FONT_WEIGHT));
  }, []);

  const decreaseFontWeight = useCallback(() => {
    setFontWeight((prev) => clamp(prev - FONT_WEIGHT_STEP, MIN_FONT_WEIGHT, MAX_FONT_WEIGHT));
  }, []);

  const resetFontWeight = useCallback(() => {
    setFontWeight(DEFAULT_FONT_WEIGHT);
  }, []);

  const setFontFamily = useCallback((id: FontFamilyId) => {
    setFontFamilyState(id);
  }, []);

  const fontStyle = useMemo<React.CSSProperties>(
    () => ({
      fontSize: `${fontSizeRem}rem`,
      fontWeight,
      fontFamily: fontFamily === "serif" ? "var(--font-serif)" : "var(--font-sans)",
    }),
    [fontSizeRem, fontWeight, fontFamily]
  );

  return {
    fontSizeRem,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    fontWeight,
    increaseFontWeight,
    decreaseFontWeight,
    resetFontWeight,
    fontFamily,
    setFontFamily,
    fontStyle,
  };
}
