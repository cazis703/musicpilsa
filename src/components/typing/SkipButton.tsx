"use client";

import { SkipNextIcon } from "@/components/ui/icons";

interface SkipButtonProps {
  onSkip: () => void;
}

export default function SkipButton({ onSkip }: SkipButtonProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="이 문장 건너뛰기"
      className="flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
    >
      이 문장 건너뛰기
      <SkipNextIcon className="h-3.5 w-3.5" />
    </button>
  );
}
