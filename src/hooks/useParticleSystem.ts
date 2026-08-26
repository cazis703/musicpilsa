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
  // tick 함수를 ref로 들고 있어야, spawnAt(항상 같은 참조를 유지해야 하는 콜백)이
  // 이 값을 참조해도 useEffect 재실행 없이 최신 tick을 부를 수 있다.
  const startLoopRef = useRef<() => void>(() => {});

  const spawnAt = useCallback((x: number, y: number, count: number = PARTICLES_PER_CHAR) => {
    spawnParticlesInPool(poolRef.current, x, y, count, cursorRef.current);
    startLoopRef.current();
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

    // 활성 파티클이 하나도 없으면 루프를 완전히 멈춘다 — 배경 영상/다른 애니메이션과
    // 자원을 나눠 쓰지 않도록, 타이핑으로 파티클이 새로 생길 때(spawnAt)만 다시 깨운다.
    const tick = (time: number) => {
      const last = lastTimeRef.current ?? time;
      const delta = Math.min(time - last, 48);
      lastTimeRef.current = time;

      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      const pool = poolRef.current;
      let hasActive = false;
      for (let i = 0; i < pool.length; i += 1) {
        const particle = pool[i];
        if (!particle.active) continue;
        updateParticle(particle, delta);
        if (!particle.active) continue;

        hasActive = true;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!hasActive) {
        rafRef.current = null;
        lastTimeRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    startLoopRef.current = () => {
      if (rafRef.current !== null) return;
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    };

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTimeRef.current = null;
      startLoopRef.current = () => {};
    };
  }, [canvasRef]);

  return { spawnAt };
}
