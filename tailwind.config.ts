import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 中国色配色体系 - 七夕浪漫主题
      colors: {
        // 胭脂红 - 主色调，爱情与热烈
        yanzhi: {
          50: "#fef2f2",
          100: "#fde2e2",
          200: "#fbcaca",
          300: "#f7a5a5",
          400: "#f07070",
          500: "#e54848",
          600: "#d12c2c",
          700: "#af2020",
          800: "#911f1f",
          900: "#782020",
          950: "#410c0c",
        },
        // 黛紫 - 深邃夜空，星河背景
        daizi: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // 月白 - 纯净高光，星光
        yuebai: {
          DEFAULT: "#f0f5ff",
          soft: "#e8f0ff",
          warm: "#fff8f0",
        },
        // 藕荷 - 柔和过渡，浪漫粉紫
        ouhe: {
          DEFAULT: "#e4c6d0",
          light: "#f0d9e0",
          deep: "#c9a0b0",
        },
        // 黛蓝 - 深夜空底色
        daiblue: {
          DEFAULT: "#1a1a2e",
          deep: "#0f0f1e",
          light: "#252545",
        },
        // 鎏金 - 点缀高光
        liujin: {
          DEFAULT: "#d4af37",
          light: "#f0d060",
          deep: "#b8941f",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', "STSong", "serif"],
        sans: ['"Noto Sans SC"', '"PingFang SC"', "Microsoft YaHei", "sans-serif"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", filter: "blur(8px)" },
          "50%": { opacity: "1", filter: "blur(12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-night":
          "linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 40%, #2d1b4e 100%)",
        "gradient-romance":
          "linear-gradient(135deg, #d12c2c 0%, #7c3aed 50%, #1a1a2e 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
