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
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
        hind: ["var(--font-hind)", "Hind Siliguri", "sans-serif"],
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
        // ERP Design System tokens
        "erp-bg": "#0B1A13",
        "erp-card": "rgba(255,255,255,0.04)",
        "erp-border": "rgba(255,255,255,0.08)",
        "erp-accent": "#22C55E",
        "erp-text-primary": "#E5E7EB",
        "erp-text-secondary": "#9CA3AF",
      },
      borderRadius: {
        "4xl": "1rem",
        "5xl": "1.25rem",
        "6xl": "1.5rem",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.25)",
        glass: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
        gold: "0 4px 14px rgba(250,204,21,0.35)",
        "gold-lg": "0 6px 24px rgba(250,204,21,0.45)",
        float: "0 8px 32px rgba(34,197,94,0.35)",
      },
      backgroundImage: {
        aura: "radial-gradient(circle at 15% 0%, rgba(15,108,90,.18), transparent 34%), radial-gradient(circle at 100% 100%, rgba(201,127,58,.14), transparent 30%), linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))",
        "dark-green": "linear-gradient(135deg, hsl(164 24% 8%), hsl(167 30% 10%))",
        "green-gold": "linear-gradient(135deg, hsl(167 46% 46% / 0.15), hsl(40 93% 64% / 0.08))",
        "erp-gradient": "linear-gradient(135deg, #0B1A13 0%, #0f2318 100%)",
        "erp-card-gradient": "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(0px)" },
        },
        erpPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },
        erpGlow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(34,197,94,0.3)" },
          "50%": { boxShadow: "0 0 28px rgba(34,197,94,0.6)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "erp-pulse": "erpPulse 3s ease-in-out infinite",
        "erp-glow": "erpGlow 2.5s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
