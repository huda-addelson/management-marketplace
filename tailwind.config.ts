import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(243 246 244 / <alpha-value>)",
        surface: "rgb(255 255 255 / <alpha-value>)",
        soft: "rgb(245 247 245 / <alpha-value>)",
        ink: "rgb(16 25 23 / <alpha-value>)",
        muted: "rgb(101 113 109 / <alpha-value>)",
        line: "rgb(14 35 30 / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(21 63 54 / <alpha-value>)",
          dark: "rgb(16 29 26 / <alpha-value>)",
          soft: "rgb(216 247 229 / <alpha-value>)",
        },
        accent: "rgb(241 109 75 / <alpha-value>)",
        amber: "rgb(239 182 75 / <alpha-value>)",
        sage: "rgb(120 167 151 / <alpha-value>)",
        "mint-strong": "rgb(154 231 187 / <alpha-value>)",
        danger: "rgb(207 76 70 / <alpha-value>)",
        income: "rgb(29 126 91 / <alpha-value>)",
        expense: "rgb(207 76 70 / <alpha-value>)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 33 28 / 0.04), 0 16px 40px rgb(25 47 40 / 0.07)",
        float: "0 24px 80px rgb(10 26 22 / 0.18)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 320ms ease-out both",
        "fade-in": "fade-in 200ms ease-out both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
