"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isReady: boolean;
}

const FADE_OUT_MS = 900;

export default function LoadingScreen({ isReady }: LoadingScreenProps) {
  const [progress, setProgress] = useState(4);
  const [isMounted, setIsMounted] = useState(true);

  // 실제 다운로드 진행률을 알 방법이 없으니, 90%까지는 점점 느려지는 속도로 채워두다가
  // 실제로 준비되면(isReady) 100%로 스냅한다 — 흔히 쓰는 "가짜 진행률" 패턴.
  // 차분한 인상을 위해 일부러 천천히 채운다(급하게 90%까지 치닫지 않도록).
  useEffect(() => {
    if (isReady) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const step = Math.max(0.15, (90 - prev) * 0.025);
        return Math.min(90, prev + step);
      });
    }, 100);
    return () => clearInterval(id);
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    setProgress(100);
    const unmountTimer = setTimeout(() => setIsMounted(false), FADE_OUT_MS);
    return () => clearTimeout(unmountTimer);
  }, [isReady]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 transition-opacity ease-out ${
        isReady ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
      aria-hidden="true"
    >
      <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/70 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
