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
          bg: "#0E1013",       // Ônix Profundo (Fundo)
          surface: "#181B20",  // Grafite Escuro (Cards/Containers)
          text: "#F4F4F6",     // Branco Acetinado
          muted: "#9CA3AF",    // Cinza Frio
          accent: "#D97736",   // Âmbar Conhaque (Destaques)
          pix: "#10B981",      // Verde Esmeralda (Preço Pix/Sucesso)
          border: "#282D37",   // Linhas e Divisórias
        },
      },
    },
  },
  plugins: [],
};

export default config;