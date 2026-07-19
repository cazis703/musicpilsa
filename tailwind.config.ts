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
      },
      animation: {
        "glow-in": "glow-in 300ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
