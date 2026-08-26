"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  driftX: number;
  driftY: number;
  twinklePhase: number;
}

const STAR_COUNT = 45;

function createStars(width: number, height: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 0.6 + Math.random() * 2.2,
    baseAlpha: 0.2 + Math.random() * 0.5,
    driftX: (Math.random() - 0.5) * 0.08,
    driftY: (Math.random() - 0.5) * 0.08,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      console.warn("StarfieldBackground: 2D context 획득 실패, 배경 별빛을 건너뜁니다.");
      return;
    }

    let width = window.innerWidth;
    let height = window.innerHeight;
    let stars = createStars(width, height);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars = createStars(width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId: number;
    let time = 0;

    const tick = () => {
      time += 0.016;
      ctx!.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.x += star.driftX;
        star.y += star.driftY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const twinkle = 0.5 + 0.5 * Math.sin(time + star.twinklePhase);
        const alpha = star.baseAlpha * (0.6 + 0.4 * twinkle);

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(226, 232, 255, ${alpha})`;
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 bg-slate-950"
      aria-hidden="true"
    />
  );
}
