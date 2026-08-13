"use client";

import { PauseIcon, PlayIcon } from "@/components/ui/icons";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export default function PlayPauseButton({ isPlaying, onToggle }: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPlaying ? "배경음악 일시정지" : "배경음악 재생"}
      aria-pressed={isPlaying}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white transition-colors hover:bg-slate-600"
    >
      {isPlaying ? (
        <PauseIcon className="h-3.5 w-3.5" />
      ) : (
        <PlayIcon className="h-3.5 w-3.5 translate-x-[1px]" />
      )}
    </button>
  );
}
