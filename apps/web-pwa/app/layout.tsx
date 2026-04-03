import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Bengali, Sora } from "next/font/google";
import ServiceWorkerRegistration from "../src/components/ServiceWorkerRegistration";
import "./globals.css";
import "./styles.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const bengaliFont = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "BD CR7",
  title: {
    default: "BD CR7 Command Center",
    template: "%s | BD CR7",
  },
  description: "Premium mobile-first command center for construction, finance, import, retail, and offline-ready field operations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BD CR7",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f6c5a",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable} ${bengaliFont.variable}`}>
      <body className="screen-shell">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
