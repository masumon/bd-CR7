/**
 * Developer & Project Identity Configuration
 * Dynamically sourced from project metadata
 * Used across all auth pages for consistent branding
 */

export const DEVELOPER_CONFIG = {
  name: "MUMAIN AHMED",
  role: "Full-stack architect, UI systems designer, and deployment lead for BD CR7",
  email: "m.a.sumon92@gmail.com",
  website: "https://mumainsumon.netlify.app",
  facebook: "https://www.facebook.com/sumon.mumain",
  whatsapp: "https://wa.me/8801825007977",
  powerLine: "Powered by SUMONIX AI | Solution by ABO ENTERPRISE",
} as const;

export const DESIGN_TOKENS = {
  colors: {
    primary: "#0f6c5a", // hsl(164, 75%, 28%)
    secondary: "#c97f3a", // Golden orange
    background: "#eef2ec",
    foreground: "#17211c",
    border: "#d5dfd8",
    glass: {
      bg: "rgba(255, 255, 255, 0.92)",
      border: "rgba(255, 255, 255, 0.08)",
      light: "rgba(255, 255, 255, 0.05)",
    },
  },
  shadows: {
    base: "0 20px 50px rgba(23, 33, 28, 0.08)",
    glass: "0 8px 32px rgba(0, 0, 0, 0.25)",
  },
  radius: {
    base: "22px",
    lg: "1.5rem",
  },
  fonts: {
    body: "'Manrope', 'Segoe UI', sans-serif",
    display: "'Sora', 'Trebuchet MS', sans-serif",
  },
} as const;
