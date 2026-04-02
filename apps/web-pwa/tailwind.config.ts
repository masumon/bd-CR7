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
        soft: "0 10px 35px rgba(2, 6, 23, 0.08)",
      },
      backgroundImage: {
        aura: "radial-gradient(circle at 20% 0%, rgba(56,189,248,.15), transparent 35%), radial-gradient(circle at 90% 100%, rgba(99,102,241,.12), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;
