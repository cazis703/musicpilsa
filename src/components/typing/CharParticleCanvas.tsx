"use client";

import { useRef } from "react";
import { useParticleSystem } from "@/hooks/useParticleSystem";

export interface CharParticleCanvasHandle {
  spawnAt: (x: number, y: number, count?: number) => void;
}

interface CharParticleCanvasProps {
  className?: string;
  handleRef?: React.MutableRefObject<CharParticleCanvasHandle | null>;
}

export default function CharParticleCanvas({ className, handleRef }: CharParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spawnAt } = useParticleSystem(canvasRef);

  if (handleRef) {
    handleRef.current = { spawnAt };
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "pointer-events-none fixed inset-0 z-30"}
      aria-hidden="true"
    />
  );
}
