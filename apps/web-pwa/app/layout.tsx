import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistration from "../src/components/ServiceWorkerRegistration";
import "./styles.css";

export const metadata: Metadata = {
  applicationName: "BD CR7",
  title: "BD CR7 PWA",
  description: "BD CR7 production-ready PWA shell",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
  themeColor: "#0f6c5a",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
