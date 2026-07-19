"use client";

import { useRef } from "react";
import CharParticleCanvas, {
  type CharParticleCanvasHandle,
} from "@/components/typing/CharParticleCanvas";
import TypingChar from "@/components/typing/TypingChar";
import { useCharEffects } from "@/hooks/useCharEffects";
import { PARTICLES_PER_CHAR } from "@/lib/particle-utils";
import type { CharState } from "@/types/typing";

interface SentenceTypingAreaProps {
  sentence: string;
  charStates: CharState[];
}

export default function SentenceTypingArea({ sentence, charStates }: SentenceTypingAreaProps) {
  const { visualCharStates } = useCharEffects(charStates);
  const particleHandleRef = useRef<CharParticleCanvasHandle | null>(null);

  const handleGlowStart = (x: number, y: number) => {
    particleHandleRef.current?.spawnAt(x, y, PARTICLES_PER_CHAR);
  };

  return (
    <div
      className="relative max-w-3xl px-8 py-10 text-center leading-relaxed break-keep"
      role="group"
      aria-label="위로 문장 따라 쓰기"
    >
      <p className="text-2xl md:text-3xl font-medium tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
        {visualCharStates.map((charState, index) => (
          <TypingChar
            key={`${sentence}-${index}`}
            char={charState.char}
            state={charState.status}
            isTypo={charState.isTypo}
            onGlowStart={handleGlowStart}
          />
        ))}
      </p>
      <CharParticleCanvas handleRef={particleHandleRef} />
    </div>
  );
}
