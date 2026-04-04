import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Noto_Sans_Bengali } from "next/font/google";
import ServiceWorkerRegistration from "../src/components/ServiceWorkerRegistration";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#0a1512",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${bodyFont.variable} ${displayFont.variable} ${bengaliFont.variable}`}>
      <body className="screen-shell">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
