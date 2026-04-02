import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
      },
      boxShadow: {
        soft: "0 18px 48px rgba(12, 38, 31, 0.12)",
      },
      backgroundImage: {
        aura: "radial-gradient(circle at 15% 0%, rgba(15,108,90,.18), transparent 34%), radial-gradient(circle at 100% 100%, rgba(201,127,58,.14), transparent 30%), linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))",
      },
    },
  },
  plugins: [],
};

export default config;
