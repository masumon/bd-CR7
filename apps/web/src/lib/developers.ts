/**
 * @file developers.ts
 * @description Developer & Project Identity Configuration — BD CR7 ERP
 * @version 2.1.0
 * @license Proprietary — © 2024–2025 ABO Enterprise. All rights reserved.
 *
 * This file is the single source of truth for developer contact info,
 * branding tokens, and attribution metadata used across all UI surfaces.
 */

// ── Developer & Ownership ─────────────────────────────────────────────────────

export const DEVELOPER_CONFIG = {
  /** Legal full name of the primary developer */
  name: "Mumain Ahmed Sumon",

  /** Professional title displayed in app credits */
  title: "Full-Stack Engineer & Systems Architect",

  /** Role context within this project */
  role: "Full-stack architect, UI systems designer, and deployment lead for BD CR7 ERP",

  /** Primary contact email */
  email: "m.a.sumon92@gmail.com",

  /** Public portfolio / personal site */
  website: "https://mumainsumon.netlify.app",

  /** GitHub profile */
  github: "https://github.com/mumainsumon",

  /** LinkedIn profile */
  linkedin: "https://www.linkedin.com/in/mumainsumon",

  /** Facebook profile */
  facebook: "https://www.facebook.com/sumon.mumain",

  /** WhatsApp direct link (BD mobile) */
  whatsapp: "https://wa.me/8801825007977",

  /** Powered-by attribution line shown in exports and footers */
  powerLine: "Powered by SUMONIX AI · Solution by ABO Enterprise",

  /** Copyright holder */
  company: "ABO Enterprise",

  /** Company location */
  location: "বৈরাগী বাজার, বিয়ানীবাজার, সিলেট, বাংলাদেশ",
} as const;

// ── Design Tokens ─────────────────────────────────────────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    primary: "#0f6c5a",     // hsl(164, 75%, 28%) — brand teal
    secondary: "#c97f3a",   // Golden amber — accent / CTA
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
