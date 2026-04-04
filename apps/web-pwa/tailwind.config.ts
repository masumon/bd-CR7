import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-body)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Poppins", "sans-serif"],
        bengali: ["var(--font-bengali)", "Noto Sans Bengali", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        ring: "hsl(var(--ring))",
        gold: "hsl(var(--gold))",
        "gold-foreground": "hsl(var(--gold-foreground))",
      },
      borderRadius: {
        "4xl": "1rem",
        "5xl": "1.25rem",
        "6xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(12, 38, 31, 0.12)",
        glass: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
        gold: "0 4px 14px rgba(250,204,21,0.35)",
        "gold-lg": "0 6px 24px rgba(250,204,21,0.45)",
      },
      backgroundImage: {
        aura: "radial-gradient(circle at 15% 0%, rgba(15,108,90,.18), transparent 34%), radial-gradient(circle at 100% 100%, rgba(201,127,58,.14), transparent 30%), linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))",
        "dark-green": "linear-gradient(135deg, hsl(164 24% 8%), hsl(167 30% 10%))",
        "green-gold": "linear-gradient(135deg, hsl(167 46% 46% / 0.15), hsl(40 93% 64% / 0.08))",
      },
    },
  },
  plugins: [],
};

export default config;
