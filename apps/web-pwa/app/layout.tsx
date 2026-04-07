import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistration from "../src/components/ServiceWorkerRegistration";
import PWAInstallPrompt from "../src/components/PWAInstallPrompt";
import { ToastContainer } from "@/components/ui/toast";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="screen-shell">
        <ServiceWorkerRegistration />
        {children}
        <PWAInstallPrompt />
        <ToastContainer />
      </body>
    </html>
  );
}
