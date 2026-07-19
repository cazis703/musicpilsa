import { useEffect, useRef } from "react";
import type { CharStatus } from "@/types/typing";

interface TypingCharProps {
  char: string;
  state: CharStatus;
  isTypo: boolean;
  onGlowStart?: (x: number, y: number) => void;
}

const STATUS_CLASS: Record<CharStatus, string> = {
  pending: "text-white/35",
  glowing: "text-white animate-glow-in",
  settled: "text-white/95 transition-opacity duration-300",
  fading: "text-white/95 opacity-0 transition-opacity duration-700 ease-out",
  gone: "text-transparent",
};

export default function TypingChar({ char, state, isTypo, onGlowStart }: TypingCharProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (state !== "glowing" || !onGlowStart) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onGlowStart(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [state, onGlowStart]);

  return (
    <span
      ref={ref}
      className={`inline-block whitespace-pre ${STATUS_CLASS[state]} ${
        isTypo ? "border-b-2 border-white/70" : "border-b-2 border-transparent"
      }`}
    >
      {char}
    </span>
  );
}
