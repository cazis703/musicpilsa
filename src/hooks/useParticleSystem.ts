"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createParticlePool,
  PARTICLE_POOL_SIZE,
  PARTICLES_PER_CHAR,
  spawnParticlesInPool,
  updateParticle,
} from "@/lib/particle-utils";

export interface UseParticleSystemReturn {
  spawnAt: (x: number, y: number, count?: number) => void;
}

export function useParticleSystem(
  canvasRef: React.RefObject<HTMLCanvasElement>
): UseParticleSystemReturn {
  const poolRef = useRef(createParticlePool(PARTICLE_POOL_SIZE));
  const cursorRef = useRef({ index: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const spawnAt = useCallback((x: number, y: number, count: number = PARTICLES_PER_CHAR) => {
    spawnParticlesInPool(poolRef.current, x, y, count, cursorRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) {
      console.warn("CharParticleCanvas: 2D context 획득 실패, 파티클 렌더링을 건너뜁니다.");
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (time: number) => {
      const last = lastTimeRef.current ?? time;
      const delta = Math.min(time - last, 48);
      lastTimeRef.current = time;

      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      const pool = poolRef.current;
      for (let i = 0; i < pool.length; i += 1) {
        const particle = pool[i];
        if (!particle.active) continue;
        updateParticle(particle, delta);
        if (!particle.active) continue;

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [canvasRef]);

  return { spawnAt };
}
