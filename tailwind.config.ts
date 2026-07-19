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
            transform: "scale(1)",
          },
          "30%": {
            textShadow:
              "0 0 16px rgba(255, 255, 255, 0.95), 0 0 28px rgba(255, 255, 255, 0.6)",
            transform: "scale(1.12)",
          },
          "100%": {
            textShadow: "0 0 0px rgba(255, 255, 255, 0)",
            transform: "scale(1)",
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
      },
      animation: {
        "glow-in": "glow-in 300ms ease-out",
        "spin-slow": "spin-slow 4s linear infinite",
        marquee: "marquee 12s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
