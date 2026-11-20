import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0F0E0E",       // Preto Obsidiana (60%)
          surface: "#1A1817",  // Grafite Escuro (30%)
          text: "#F5F5F4",     // Branco Pérola
          muted: "#A8A29E",    // Prata Fosco
          accent: "#C5A059",   // Champagne Dourado (10% - CTAs e destaques)
          gold: "#D4AF37",     // Dourado Clássico (hover/foco)
          pix: "#10B981",      // Verde Esmeralda (Preço Pix)
          border: "#2B2725",   // Linhas sutis quentes
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;