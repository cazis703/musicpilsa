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
        // 단순 상하 왕복(translateY만)보다 "둥둥 떠 있는" 느낌을 주기 위해 살짝 원을
        // 그리듯 좌우로도 드리프트한다. 각 오브의 실제 재생 속도/딜레이는
        // AmbientOrb.tsx에서 사운드 id마다 다르게 줘서(desync) 여러 개가 켜져 있어도
        // 전부 같은 박자로 움직이지 않게 한다.
        "orb-bob": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(5px, -11px) rotate(1.5deg)" },
          "50%": { transform: "translate(0, -16px) rotate(0deg)" },
          "75%": { transform: "translate(-5px, -9px) rotate(-1.5deg)" },
        },
        // translate(-50%, -50%)를 반드시 함께 넣어야 한다 — 애니메이션이 transform 전체를
        // 덮어써버리므로, 이걸 빼면 wrap에 걸어둔 -translate-x-1/2 -translate-y-1/2(오브를
        // x/y% 지점에 중앙 정렬시키는 값)가 애니메이션 종료 후(fill-mode: both) 사라져서
        // 오브 전체가 오른쪽 아래로 wrap 크기의 절반만큼 밀려 보인다.
        "orb-enter": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.4)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        // tasks/mockups(Glow Orbs 목업)의 .typing-mock 참고 — translateY(10px)에서 0으로,
        // ease-out으로 살짝 떠 있다 내려오며 페이드인.
        "fade-up-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // AudioController의 고정 하단 바처럼 이미 -translate-x-1/2로 가로 중앙정렬된
        // 요소에 쓴다. orb-enter와 같은 이유로, 애니메이션이 transform 전체를 덮어쓰므로
        // 기존 중앙정렬 값(-50%)을 keyframe 안에 반드시 함께 넣어야 애니메이션 종료 후에도
        // 가운데 정렬이 풀리지 않는다. (같은 목업의 .controlbar-mock 참고)
        "fade-up-in-x": {
          "0%": { opacity: "0", transform: "translate(-50%, 14px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        // 재생목록에서 지금 재생 중인 곡 옆에 붙는 이퀄라이저 바(PlayingEqualizer)용.
        // 막대마다 다른 animation-delay(음수)를 줘서 셋이 어긋난 박자로 오르내리게 한다.
        "eq-bounce": {
          "0%, 100%": { transform: "scaleY(0.28)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "glow-in": "glow-in 300ms ease-out",
        "spin-slow": "spin-slow 4s linear infinite",
        marquee: "marquee 12s linear infinite",
        "orb-bob": "orb-bob 7s ease-in-out infinite",
        "orb-enter": "orb-enter 0.5s cubic-bezier(0.2,0.8,0.2,1) both",
        "fade-up-in": "fade-up-in 0.8s ease-out both",
        "fade-up-in-x": "fade-up-in-x 0.7s ease-out both",
        "eq-bounce": "eq-bounce 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
