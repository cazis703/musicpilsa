import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "glow-in": {
          "0%": {
            textShadow: "0 0 0px rgba(255, 255, 255, 0)",
          },
          "30%": {
            textShadow:
              "0 0 16px rgba(255, 255, 255, 0.95), 0 0 28px rgba(255, 255, 255, 0.6)",
          },
          "100%": {
            textShadow: "0 0 0px rgba(255, 255, 255, 0)",
          },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "orb-bob": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-9px) rotate(2.5deg)" },
        },
        // translate(-50%, -50%)를 반드시 함께 넣어야 한다 — 애니메이션이 transform 전체를
        // 덮어써버리므로, 이걸 빼면 wrap에 걸어둔 -translate-x-1/2 -translate-y-1/2(오브를
        // x/y% 지점에 중앙 정렬시키는 값)가 애니메이션 종료 후(fill-mode: both) 사라져서
        // 오브 전체가 오른쪽 아래로 wrap 크기의 절반만큼 밀려 보인다.
        "orb-enter": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.4)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "fade-up-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // AudioController의 고정 하단 바처럼 이미 -translate-x-1/2로 가로 중앙정렬된
        // 요소에 쓴다. orb-enter와 같은 이유로, 애니메이션이 transform 전체를 덮어쓰므로
        // 기존 중앙정렬 값(-50%)을 keyframe 안에 반드시 함께 넣어야 애니메이션 종료 후에도
        // 가운데 정렬이 풀리지 않는다.
        "fade-up-in-x": {
          "0%": { opacity: "0", transform: "translate(-50%, 14px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        "glow-in": "glow-in 300ms ease-out",
        "spin-slow": "spin-slow 4s linear infinite",
        marquee: "marquee 12s linear infinite",
        "orb-bob": "orb-bob 7s ease-in-out infinite",
        "orb-enter": "orb-enter 0.5s cubic-bezier(0.2,0.8,0.2,1) both",
        "fade-up-in": "fade-up-in 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-up-in-x": "fade-up-in-x 0.6s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
